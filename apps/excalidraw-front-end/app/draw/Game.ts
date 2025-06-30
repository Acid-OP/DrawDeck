import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      radius: number;
    }
  | {
      type: "diamond";
      top: { x: number; y: number };
      right: { x: number; y: number };
      bottom: { x: number; y: number };
      left: { x: number; y: number };
    }
  | { type: "circle"; 
      centerX: number;
      centerY: number; 
      rx: number; 
      ry: number 
    }
  | {
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "pencil";
      points: { x: number; y: number }[];
    }
  | {
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
    };

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
  private roomId: string;
  private clicked: boolean;
  private startX: number | null = null;
  private startY: number | null = null;
  private endX: number | null = null;
  private endY: number | null = null;
  private selectedTool: Tool = "circle";
  private pencilPoints: { x: number; y: number }[] = [];
  public onTextInsert?: (x: number, y: number) => void;
  public onToolChange?: (tool: Tool) => void;
  private selectedShapeIndex: number | null = null;
  private hoveredForErase: number[] = [];
  socket: WebSocket;

  // ─── Rounded Square Handle ─────────────────────────────
  private drawHandleBox(
    cx: number,
    cy: number,
    size = 10,
    color = "#9b7bff"
  ) {
    const half = size / 2;
    this.ctx.beginPath();
    this.ctx.roundRect(cx - half, cy - half, size, size, 3);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  // ─── Circle Handle for Line/Arrow ──────────────────────
  private drawCircleHandle(
    cx: number,
    cy: number,
    filled: boolean,
    r = 6,
    color = "#9b7bff"
  ) {
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    filled ? (this.ctx.fillStyle = color, this.ctx.fill()) :(this.ctx.strokeStyle = color, this.ctx.lineWidth = 1.5, this.ctx.stroke());
    this.ctx.closePath();
  }

  // ─── Line & Arrow Selection Handles ─────────────────────
  private drawLineHandles(shape: Extract<Shape, { type: "line" | "arrow" }>) {
    const { startX, startY, endX, endY } = shape;
    const r = 6;
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const ux = dx / len, uy = dy / len;
    const startCx = startX - ux * r, startCy = startY - uy * r;
    const endCx   = endX   + ux * r, endCy   = endY   + uy * r;
    const midCx   = (startX + endX) / 2, midCy = (startY + endY) / 2;

    this.drawCircleHandle(startCx, startCy, false, r);
    this.drawCircleHandle(endCx,   endCy,   false, r);
    this.drawCircleHandle(midCx,   midCy,   true , r);
  }

  // ─── Line Connecting Selection Box to Handle ────────────
  private drawConnectorLineToHandle(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    stopDistance = 5
  ) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len === 0) return;

    const ux = dx / len;
    const uy = dy / len;

    const endX = toX - ux * stopDistance;
    const endY = toY - uy * stopDistance;

    this.ctx.beginPath();
    this.ctx.moveTo(fromX, fromY);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
  }

  // ─── Selection Box with External Handles ────────────────
  private drawSelectionBox(shape: Shape) {
    this.ctx.save();
    this.ctx.strokeStyle = "#9b7bff";  
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([]);

    const pad = 8;
    const handleSize = 10;
    const stopDist = handleSize / 2;

    // ───────── RECT ─────────
    if (shape.type === "rect") {
      const x = shape.x - pad;
      const y = shape.y - pad;
      const w = shape.width + pad * 2;
      const h = shape.height + pad * 2;

      this.ctx.strokeRect(x, y, w, h);

      const handles = [
        { x: x,     y: y },
        { x: x + w, y: y },
        { x: x + w, y: y + h },
        { x: x,     y: y + h },
      ];

      for (const { x: hx, y: hy } of handles) {
        const fromX = hx === x ? x : x + w;
        const fromY = hy === y ? y : y + h;
        this.drawConnectorLineToHandle(fromX, fromY, hx, hy, stopDist);
        this.drawHandleBox(hx, hy);
      }

      this.ctx.restore();
      return;
    }

    // ───────── CIRCLE (Ellipse) ─────────
    if (shape.type === "circle") {
      const x = shape.centerX - shape.rx - pad;
      const y = shape.centerY - shape.ry - pad;
      const w = shape.rx * 2 + pad * 2;
      const h = shape.ry * 2 + pad * 2;

      this.ctx.strokeRect(x, y, w, h);

      const centerX = x + w / 2;
      const centerY = y + h / 2;

      const handles = [
      { x: x,     y: y },         // top-left
      { x: x + w, y: y },         // top-right
      { x: x + w, y: y + h },     // bottom-right
      { x: x,     y: y + h },     // bottom-left
      ];
      for (const { x: hx, y: hy } of handles) {
        const fromX = hx < centerX ? x : x + w;
        const fromY = hy < centerY ? y : y + h;
        this.drawConnectorLineToHandle(fromX, fromY, hx, hy, stopDist);
        this.drawHandleBox(hx, hy);
      }
      this.ctx.restore();
      return;
    }
    // ───────── DIAMOND ─────────
    if (shape.type === "diamond") {
      const xs = [shape.top.x, shape.right.x, shape.bottom.x, shape.left.x];
      const ys = [shape.top.y, shape.right.y, shape.bottom.y, shape.left.y];
      const minX = Math.min(...xs) - pad;
      const maxX = Math.max(...xs) + pad;
      const minY = Math.min(...ys) - pad;
      const maxY = Math.max(...ys) + pad;

      this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const corners = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];

      for (const { x: hx, y: hy } of corners) {
        this.drawConnectorLineToHandle(
        hx < centerX ? minX : maxX,
        hy < centerY ? minY : maxY,
        hx, hy, stopDist
      );
      this.drawHandleBox(hx, hy);
    }

    this.ctx.restore();
    return;
  }

  // ───────── TEXT ─────────
    if (shape.type === "text") {
      const width = this.ctx.measureText(shape.text).width;
      const height = 20;
      const x = shape.x - pad / 2;
      const y = shape.y - height + pad / 2;
      const w = width + pad;
      const h = height + pad;

      this.ctx.strokeRect(x, y, w, h);

      const corners = [
        { x: x,     y: y },
        { x: x + w, y: y },
        { x: x + w, y: y + h },
        { x: x,     y: y + h },
      ];

      for (const { x: hx, y: hy } of corners) {
        const fromX = hx < x + w / 2 ? x : x + w;
        const fromY = hy < y + h / 2 ? y : y + h;
        this.drawConnectorLineToHandle(fromX, fromY, hx, hy, stopDist);
        this.drawHandleBox(hx, hy);
      }

      this.ctx.restore();
      return;
    }

    // ───────── PENCIL ─────────
    if (shape.type === "pencil") {
      const xs = shape.points.map(p => p.x);
      const ys = shape.points.map(p => p.y);
      const minX = Math.min(...xs) - pad;
      const maxX = Math.max(...xs) + pad;
      const minY = Math.min(...ys) - pad;
      const maxY = Math.max(...ys) + pad;

      this.ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const corners = [
        { x: minX, y: minY },
        { x: maxX, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];

      for (const { x: hx, y: hy } of corners) {
        this.drawConnectorLineToHandle(
          hx < centerX ? minX : maxX,
          hy < centerY ? minY : maxY,
          hx, hy, stopDist
        );
        this.drawHandleBox(hx, hy);
      }

      this.ctx.restore();
      return;
    }

    // ───────── LINE / ARROW ─────────
    if (shape.type === "line" || shape.type === "arrow") {
      this.drawLineHandles(shape); // already has proper circular handles
      this.ctx.restore();
      return;
    }

    this.ctx.restore();
  }

  private isPointNearLineSegment(px: number, py: number,x1: number, y1: number,x2: number, y2: number,tol: number): boolean {
  const ABx = x2 - x1;
  const ABy = y2 - y1;
  const APx = px - x1;
  const APy = py - y1;

  const ab2 = ABx * ABx + ABy * ABy;
  if (ab2 === 0) return false;

  let t = (APx * ABx + APy * ABy) / ab2;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * ABx;
  const closestY = y1 + t * ABy;

  const dx = px - closestX;
  const dy = py - closestY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return dist <= tol;
}
  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }


isPointInsideShape(x: number, y: number, shape: Shape): boolean {
  const tol = 10;
  switch (shape.type) {
    case "line":
    case "arrow": {
      return this.isPointNearLineSegment(
        x, y,
        shape.startX, shape.startY,
        shape.endX, shape.endY,
        tol
      );
    }
    case "pencil": {
      for (let i = 0; i < shape.points.length - 1; i++) {
        if (this.isPointNearLineSegment(
          x, y,
          shape.points[i].x, shape.points[i].y,
          shape.points[i + 1].x, shape.points[i + 1].y,
          tol
        )) {
          return true;
        }
      }
      return false;
    }
    case "diamond": {
      const xs = [shape.top.x, shape.right.x, shape.bottom.x, shape.left.x];
      const ys = [shape.top.y, shape.right.y, shape.bottom.y, shape.left.y];
      const minX = Math.min(...xs) - tol;
      const maxX = Math.max(...xs) + tol;
      const minY = Math.min(...ys) - tol;
      const maxY = Math.max(...ys) + tol;
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }
    case "rect": {
      return (
        x >= shape.x - tol &&
        x <= shape.x + shape.width + tol &&
        y >= shape.y - tol &&
        y <= shape.y + shape.height + tol
      );
    }
    case "circle": {
      const dx = x - shape.centerX;
      const dy = y - shape.centerY;
      const norm = (dx * dx) / (shape.rx * shape.rx) + (dy * dy) / (shape.ry * shape.ry);
      return norm <= 1.1; // small buffer added
    }
    case "text": {
      const width = this.ctx.measureText(shape.text).width;
      const height = 20;
      return (
        x >= shape.x &&
        x <= shape.x + width &&
        y <= shape.y &&
        y >= shape.y - height
      );
    }
    default:
      return false;
  }
}


  addTextShape(x: number, y: number, text: string) {
    const shape = {
      type: "text" as const,
      x,
      y,
      text,
    };

    this.existingShapes.push(shape);

    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId: this.roomId,
      })
    );

    this.clearCanvas();
  }

  getMousePos = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  drawDiamond(
    top: { x: number; y: number },
    right: { x: number; y: number },
    bottom: { x: number; y: number },
    left: { x: number; y: number },
    radius: number = 10
  ) {
    this.ctx.beginPath();
    this.ctx.moveTo(top.x, top.y);
    this.ctx.quadraticCurveTo(top.x, top.y, top.x, top.y);
    this.ctx.lineTo(right.x, right.y);
    this.ctx.quadraticCurveTo(right.x, right.y, right.x, right.y);
    this.ctx.lineTo(bottom.x, bottom.y);
    this.ctx.quadraticCurveTo(bottom.x, bottom.y, bottom.x, bottom.y);
    this.ctx.lineTo(left.x, left.y);
    this.ctx.quadraticCurveTo(left.x, left.y, left.x, left.y);
    this.ctx.lineTo(top.x, top.y);
    this.ctx.stroke();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  }

  setTool(tool: Tool) {
    this.selectedTool = tool;
  }

  async init() {
    this.existingShapes = await getExistingShapes(this.roomId);
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "chat") {
        const parsedShape = JSON.parse(message.message);
        this.existingShapes.push(parsedShape.shape);
        this.clearCanvas();
      }
    };
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(18,18,18,255)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.existingShapes.forEach((shape , idx) => {
      /* ── highlight logic ───────────────────────────── */
      const isHovered =
      this.selectedTool === "eraser" &&
      this.hoveredForErase?.includes(idx);
      // use red-ish highlight while hovering, otherwise normal white
      const strokeCol = isHovered ? "rgba(255,80,80)" : "rgba(255,255,255)";
      const fillCol   = isHovered ? "rgba(255,80,80)" : "rgba(255,255,255)";

      if (shape.type === "rect") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.beginPath();
        this.ctx.roundRect(shape.x, shape.y, shape.width, shape.height, 16);
        this.ctx.stroke();
      } else if (shape.type === "diamond") {
        this.ctx.strokeStyle = strokeCol;
        this.drawDiamond(shape.top, shape.right, shape.bottom, shape.left);
      } else if (shape.type === "circle") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.beginPath();
        this.ctx.ellipse(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.rx), 
          Math.abs(shape.ry), 
          0,
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil") {
        this.ctx.strokeStyle = strokeCol;
        this.drawPencilPath(shape.points);
      } else if (shape.type === "line" || shape.type === "arrow") {
        this.ctx.strokeStyle = strokeCol;
        // draw the actual segment/arrow
        this.drawArrow(this.ctx, shape.startX, shape.startY, shape.endX, shape.endY);
        if (this.selectedTool === "select" && this.selectedShapeIndex === this.existingShapes.indexOf(shape)) {
          this.drawLineHandles(shape);
        }
      } else if (shape.type === "text") {
        this.ctx.fillStyle = "rgba(255, 255, 255)";
        this.ctx.fillStyle = fillCol;             // red or white
        this.ctx.font = "16px Arial";
        this.ctx.fillText(shape.text, shape.x, shape.y);
      }
      if (this.selectedTool === "select" && this.selectedShapeIndex === this.existingShapes.indexOf(shape)) {
        this.drawSelectionBox(shape);
      }
    });    
  }

  drawPencilPath(points: { x: number; y: number }[]) {
    if (!points || points.length < 2) return;

    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.strokeStyle = "rgba(255, 255, 255)";
    this.ctx.stroke();
    this.ctx.closePath();
  }

  mouseDownHandler = (e: MouseEvent) => {
    const pos = this.getMousePos(e);

    if (this.selectedTool === "select") {
      for (let i = this.existingShapes.length - 1; i >= 0; i--) {
        if (this.isPointInsideShape(pos.x, pos.y, this.existingShapes[i])) {
          this.selectedShapeIndex = i;
          this.clearCanvas();
          return;
        }
      }
      this.selectedShapeIndex = null;
      this.clearCanvas();
      return;
    }
    if (this.selectedTool === "eraser") {
      this.clicked = true;
      this.hoveredForErase = [];
      for (let i = 0; i < this.existingShapes.length; i++) {
        if (this.isPointInsideShape(pos.x, pos.y, this.existingShapes[i])) {
          this.hoveredForErase.push(i);
        }
      }
      this.clearCanvas();
      return;
    }
    if (this.selectedTool === "pencil") {
      this.clicked = true;
      this.pencilPoints = [pos];
      return;
    }
    this.clicked = true;
    this.startX = pos.x;
    this.startY = pos.y;
    this.endX = pos.x;
    this.endY = pos.y;
  };

  drawArrow(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) {
    const headLength = 10;
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowTipX = endX;
    const arrowTipY = endY;
    const leftX = arrowTipX - headLength * Math.cos(angle - Math.PI / 6);
    const leftY = arrowTipY - headLength * Math.sin(angle - Math.PI / 6);
    const rightX = arrowTipX - headLength * Math.cos(angle + Math.PI / 6);
    const rightY = arrowTipY - headLength * Math.sin(angle + Math.PI / 6);
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(arrowTipX, arrowTipY);
    ctx.lineTo(leftX, leftY);
    ctx.moveTo(arrowTipX, arrowTipY);
    ctx.lineTo(rightX, rightY);
    ctx.stroke();
  }

  mouseUpHandler = (e: MouseEvent) => {
    const pos = this.getMousePos(e);
    this.clicked = false;
    if (this.selectedTool === "eraser" && this.hoveredForErase.length) {
      // remove in reverse order so indices stay valid
      this.hoveredForErase
        .sort((a, b) => b - a)
        .forEach(idx => this.existingShapes.splice(idx, 1));
      this.hoveredForErase = [];
      this.clearCanvas();
      return;
    }
    let shape: Shape | null = null;
    if (this.selectedTool === "rect") {
      if (this.startX === null || this.startY === null) return;
      shape = {
        type: "rect",
        x: this.startX,
        y: this.startY,
        width: pos.x - this.startX,
        height: pos.y - this.startY,
        radius: 10,
      };
    } else if (this.selectedTool === "diamond") {
      if (this.startX === null || this.startY === null) return;
      const width = pos.x - this.startX;
      const height = pos.y - this.startY;
      const cx = this.startX + width / 2;
      const cy = this.startY + height / 2;
      shape = {
        type: "diamond",
        top: { x: cx, y: cy - height / 2 },
        right: { x: cx + width / 2, y: cy },
        bottom: { x: cx, y: cy + height / 2 },
        left: { x: cx - width / 2, y: cy },
      };
    } else if (this.selectedTool === "circle") {
      if (this.startX === null || this.startY === null) return;
      const rx = Math.abs((pos.x - this.startX) / 2);
      const ry = Math.abs((pos.y - this.startY) / 2);
      const cx = this.startX + (pos.x - this.startX) / 2;
      const cy = this.startY + (pos.y - this.startY) / 2;

      shape = {
        type: "circle",  
        rx,          
        ry,            
        centerX: cx,
        centerY: cy,
      };
    } else if (this.selectedTool === "line") {
      if (
        this.startX === null ||
        this.startY === null ||
        this.endX === null ||
        this.endY === null
      ) return;
      shape = {
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX: this.endX,
        endY: this.endY,
      };

      if (this.onToolChange) this.onToolChange("select");
    } else if (this.selectedTool === "pencil") {
      this.pencilPoints.push(pos);
      shape = {
        type: "pencil",
        points: this.pencilPoints,
      };
    } else if (this.selectedTool === "arrow") {
      if (this.startX === null || this.startY === null || (pos.x === this.startX && pos.y === this.startY)) return;
      shape = {
        type: "arrow",
        startX: this.startX,
        startY: this.startY,
        endX: pos.x,
        endY: pos.y,
      };

      if (this.onToolChange) this.onToolChange("select");
    } else if (this.selectedTool === "text") {
      if ((window as any).justBlurredTextInput) return;
      setTimeout(() => {
        if (this.onTextInsert) {
          this.onTextInsert(pos.x, pos.y);
        }
      }, 0);
      return;}
      if (!shape) return;
      this.existingShapes.push(shape);
      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape }),
          roomId: this.roomId,
        })
      );
      this.clearCanvas();
      this.startX = null;
      this.startY = null;
      this.endX = null;
      this.endY = null;
      this.pencilPoints = [];
    };

  mouseMoveHandler = (e: MouseEvent) => {
    const pos = this.getMousePos(e);
    if (this.selectedTool === "eraser") {
    if (!this.clicked) return; // only track while button is down
    for (let i = 0; i < this.existingShapes.length; i++) {
      if (this.isPointInsideShape(pos.x, pos.y, this.existingShapes[i]) && !this.hoveredForErase.includes(i)) {
        this.hoveredForErase.push(i);
      }
    }
    this.clearCanvas(); // redraw with red strokes
    return;
  }
    if (!this.clicked) return;
    if (this.selectedTool === "pencil") {
      this.pencilPoints.push(pos);
      this.clearCanvas();
      this.drawPencilPath(this.pencilPoints);
    } else {
      if (this.startX === null || this.startY === null) return;
      const width = pos.x - this.startX;
      const height = pos.y - this.startY;
      this.clearCanvas();
      this.ctx.strokeStyle = "rgba(255, 255, 255)";
      const cx = this.startX + width / 2;
      const cy = this.startY + height / 2;
      const top = { x: cx, y: cy - height / 2 };
      const right = { x: cx + width / 2, y: cy };
      const bottom = { x: cx, y: cy + height / 2 };
      const left = { x: cx - width / 2, y: cy };
      const radius = 10;
      if (this.selectedTool === "rect") {
        this.ctx.beginPath();
        this.ctx.roundRect(this.startX, this.startY, width, height, 10);
        this.ctx.stroke();
      } else if (this.selectedTool === "diamond") {
        this.drawDiamond(top, right, bottom, left, 10);
      } else if (this.selectedTool === "circle") {
      // ― live ellipse preview ―
        const rx = Math.abs((pos.x - this.startX) / 2);
        const ry = Math.abs((pos.y - this.startY) / 2);
        const cx = this.startX + (pos.x - this.startX) / 2;
        const cy = this.startY + (pos.y - this.startY) / 2;
        this.ctx.beginPath();
        this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (this.selectedTool === "line") {
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(pos.x, pos.y);
        this.ctx.stroke();
        this.ctx.closePath();
        this.endX = pos.x;
        this.endY = pos.y;
      } else if (this.selectedTool === "arrow") {
        this.clearCanvas(); 
        this.drawArrow(this.ctx, this.startX, this.startY, pos.x, pos.y);
        this.endX = pos.x;
        this.endY = pos.y;
      } else if (this.selectedTool === "text") {
        this.clearCanvas();
        this.ctx.fillStyle = "rgba(255, 255, 255)";
        this.ctx.font = "16px Arial";
        this.ctx.fillText("Sample Text", pos.x, pos.y);
      }
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
}
