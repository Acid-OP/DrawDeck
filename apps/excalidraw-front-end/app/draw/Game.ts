import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
import axios from "axios";
import { BACKEND_URL } from "@/config";

type BaseShape = { readonly id: string };
type Shape =
  |  (BaseShape &{
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      radius: number;
    })
  | (BaseShape &{
      type: "diamond";
      top: { x: number; y: number };
      right: { x: number; y: number };
      bottom: { x: number; y: number };
      left: { x: number; y: number };
    })
  | (BaseShape &{ 
    type: "circle"; 
      centerX: number;
      centerY: number; 
      rx: number; 
      ry: number 
    })
  | (BaseShape &{
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    })
  | (BaseShape &{
      type: "pencil";
      points: { x: number; y: number }[];
    })
  | (BaseShape &{
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    })
  | (BaseShape &{
      type: "text";
      x: number;
      y: number;
      text: string;
    });

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[];
  private roomId?: number | null;
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
  socket?: WebSocket | null;
  private dragMode: "none" | "move" | "resize" = "none";
  private activeHandle: "tl" | "tr" | "bl" | "br" | "start" | "end" | null = null;
  private offsetX = 0;
  private offsetY = 0;
  private readonly MAX_CORNER_RADIUS = 10;
  private isSolo: boolean;
  private hoveredEndpoint: "start" | "end" | "mid" | null = null;
  private genId() {
    return crypto.randomUUID();
  }
  private localStorageTimeout: any = null;
  private isInit = false;
  private scheduleLocalSave() {
    if (!this.isSolo) return;
    if (this.localStorageTimeout) clearTimeout(this.localStorageTimeout);
    this.localStorageTimeout = setTimeout(() => {
      this.saveToLocalStorage();
    }, 1000); // 1 second delay
  }
  private pendingWrites: Shape[] = [];
  private flushTimeout: any = null;
  private saveToLocalStorage() {
    if (!this.isSolo) return;
    try {
      localStorage.setItem("solo_shapes", JSON.stringify(this.existingShapes));
    } catch (err) {
      console.error("Failed to save shapes to localStorage", err);
    }
  }

  private scheduleWrite(shape: Shape) {
    if (!this.roomId) return;
    this.pendingWrites.push(shape);
    if (this.flushTimeout) clearTimeout(this.flushTimeout);
    this.flushTimeout = setTimeout(() => {
      this.flushToDB();
    }, 1000);
  }
  
  private safeSend(payload: any) {
    if (this.isSolo || !this.socket || !this.roomId) return;
    this.socket.send(JSON.stringify(payload));
  }


  private async flushToDB() {
    if (this.isSolo || !this.roomId) return;
    const shapes = [...this.pendingWrites];
    this.pendingWrites = [];
    try {
      await axios.post(`${BACKEND_URL}/shapes/${this.roomId}`, { shapes }, {
        headers: { Authorization: localStorage.getItem("token") ?? "" },
      });
    } catch (err) {
      console.error("Flush failed", err);
    }
  }

  private hitTestShapeHandle(
    shape: Shape,
    mx: number,
    my: number,
    radius = 8      // hit‑area
    ): "tl" | "tr" | "bl" | "br" | null {
      const sq = (dx:number,dy:number)=>dx*dx+dy*dy;
      const r2 = radius * radius;
      const test = (hx:number,hy:number,name:"tl"|"tr"|"bl"|"br") =>
        sq(mx-hx,my-hy)<=r2 ? name : null;
      switch (shape.type) {
        case "rect": {
          const {x,y,width,height} = shape;
          return (
            test(x,y,"tl")           ||
            test(x+width,y,"tr")     ||
            test(x,y+height,"bl")    ||
            test(x+width,y+height,"br")
          );
        }
        case "circle": {
          const {centerX,centerY,rx,ry} = shape;
          return (
            test(centerX-rx,centerY-ry,"tl") ||
            test(centerX+rx,centerY-ry,"tr") ||
            test(centerX-rx,centerY+ry,"bl") ||
            test(centerX+rx,centerY+ry,"br")
          );
        }
      }
    return null;
  }
  private cursorForHandle(h:"tl"|"tr"|"bl"|"br"|"move"|"none"){
    switch(h){
      case "tl":case "br": return "nwse-resize";
      case "tr":case "bl": return "nesw-resize";
      case "move": return "move";
      default:return "default";
    }
  }
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
  private drawCircleHandle(x: number,y: number,isMid: boolean,r: number,isHovered: boolean = false) {
    const ctx = this.ctx;
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(98, 80, 223, 0.4)"; // translucent purple outer ring on hover
      ctx.lineWidth = 6;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);

    if (isMid) {
      ctx.fillStyle = "#6250df"; // filled purple for middle handle
      ctx.fill();
    } else {
      ctx.fillStyle = "transparent"; // hollow for start/end handles
    }

    ctx.strokeStyle = "#6250df"; // purple border for all
    ctx.lineWidth = 1.5;
    ctx.stroke();
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
    this.drawCircleHandle(startCx, startCy, false, r, this.hoveredEndpoint === "start");
    this.drawCircleHandle(endCx, endCy, false, r, this.hoveredEndpoint === "end");
    this.drawCircleHandle(midCx, midCy, true, r, this.hoveredEndpoint === "mid");
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

    if (shape.type === "rect") {
      const x1 = Math.min(shape.x, shape.x + shape.width);
      const y1 = Math.min(shape.y, shape.y + shape.height);
      const x2 = Math.max(shape.x, shape.x + shape.width);
      const y2 = Math.max(shape.y, shape.y + shape.height);

      const x = x1 - pad;
      const y = y1 - pad;
      const w = (x2-x1) + pad * 2;
      const h = (y2-y1) + pad * 2;

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
    if (shape.type === "circle") {
      const x = shape.centerX - shape.rx - pad;
      const y = shape.centerY - shape.ry - pad;
      const w = shape.rx * 2 + pad * 2;
      const h = shape.ry * 2 + pad * 2;

      this.ctx.strokeRect(x, y, w, h);

      const centerX = x + w / 2;
      const centerY = y + h / 2;

      const handles = [
      { x: x,     y: y },
      { x: x + w, y: y },
      { x: x + w, y: y + h },  
      { x: x,     y: y + h },    
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
    
    if (shape.type === "line" || shape.type === "arrow") {
      this.drawLineHandles(shape); 
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
  constructor(canvas: HTMLCanvasElement, roomId: number | null, socket: WebSocket | null , isSolo:boolean=false) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.isSolo = isSolo;
    this.roomId = roomId;
    this.socket = socket;
    this.clicked = false;
    this.init();
    if (!isSolo && this.socket) this.initHandlers();
    this.initMouseHandlers();
  }
  clearSoloShapes() {
    if (!this.isSolo) return;
    this.existingShapes = [];
    localStorage.removeItem("solo_shapes");
    this.clearCanvas();
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
        const x1 = Math.min(shape.x, shape.x + shape.width) - tol;
        const x2 = Math.max(shape.x, shape.x + shape.width) + tol;
        const y1 = Math.min(shape.y, shape.y + shape.height) - tol;
        const y2 = Math.max(shape.y, shape.y + shape.height) + tol;
        return x >= x1 && x <= x2 && y >= y1 && y <= y2;
      }
      case "circle": {
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        const norm = (dx * dx) / (shape.rx * shape.rx) + (dy * dy) / (shape.ry * shape.ry);
        return norm <= 1.1;
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
      id: this.genId(),
      type: "text" as const,
      x,
      y,
      text,
    };

    this.existingShapes.push(shape);
    if(!this.isSolo){
      this.safeSend(JSON.stringify({
        type: "shape:add",
        roomId: this.roomId?.toString(),
        shape,
      }));
    this.scheduleWrite(shape);
    }
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
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushToDB();
    }
  }
  setTool(tool: Tool) {
    this.selectedTool = tool;
  }
  
  async init() {
    this.isInit = true;
    if (this.isSolo) {
      const saved = localStorage.getItem("solo_shapes");
      if (saved) {
        try {
          const shapes: Shape[] = JSON.parse(saved);
          this.existingShapes = shapes;
        } catch (e) {
          console.error("Failed to parse saved solo shapes", e);
        }
      }
      this.clearCanvas();
      this.isInit = false;
      return;
    }
    if (!this.roomId) return; 
    const shapes = await getExistingShapes(this.roomId);
    const seenIds = new Set(this.existingShapes.map(s => s.id));
    shapes.forEach(shape => {
      if (!seenIds.has(shape.id)) {
        this.existingShapes.push(shape);
      }
    });

    this.clearCanvas();
  }

  initHandlers() {
    if (!this.socket || !this.roomId) return;
    this.socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.roomId !== this.roomId?.toString()) return;
      switch (msg.type) {
        case "shape:add": {
          const existing = this.existingShapes.find(s => s.id === msg.shape.id);
          if (!existing) {
            this.existingShapes.push(msg.shape);
            this.clearCanvas();
          }
          break;
        }
        case "shape:delete": {
          const idx = this.existingShapes.findIndex(s => s.id === msg.shapeId);
          if (idx !== -1) {
            this.existingShapes.splice(idx, 1);
            this.clearCanvas();
          }
          break;
        }
      }
    };
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(18,18,18,255)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.existingShapes.forEach((shape , idx) => {
      const isHovered =
      this.selectedTool === "eraser" &&
      this.hoveredForErase?.includes(idx);
      const strokeCol = isHovered ? "rgba(255,80,80)" : "rgba(255,255,255)";
      const fillCol   = isHovered ? "rgba(255,80,80)" : "rgba(255,255,255)";
      if (shape.type === "rect") {
        this.ctx.strokeStyle = strokeCol;
        const r = Math.min(
          this.MAX_CORNER_RADIUS,
          Math.abs(shape.width) * 0.5,
          Math.abs(shape.height) * 0.5
        );
        this.ctx.beginPath();
        this.ctx.roundRect(shape.x, shape.y, shape.width, shape.height, r);
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
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        this.ctx.closePath();
        if (shape.type === "arrow") {
          this.drawArrow(this.ctx, shape.startX, shape.startY, shape.endX, shape.endY);
        }
        if (
          this.selectedTool === "select" &&
          this.selectedShapeIndex === this.existingShapes.indexOf(shape)
        ) {
          this.drawLineHandles(shape);
        }
      } else if (shape.type === "text") {
        this.ctx.fillStyle = "rgba(255, 255, 255)";
        this.ctx.fillStyle = fillCol; 
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
    if (this.selectedTool==="select" && this.selectedShapeIndex!=null){
      const shape=this.existingShapes[this.selectedShapeIndex];
      if (shape.type === "line" || shape.type === "arrow") {
      const dist = (x1: number, y1: number, x2: number, y2: number) =>
        Math.hypot(x2 - x1, y2 - y1);
      const handleRadius = 8;

      const hoverStart = dist(pos.x, pos.y, shape.startX, shape.startY) < handleRadius;
      const hoverEnd = dist(pos.x, pos.y, shape.endX, shape.endY) < handleRadius;

      if (hoverStart) {
        this.dragMode = "resize";
        this.activeHandle = "start";
        e.preventDefault();
        return;
      } else if (hoverEnd) {
        this.dragMode = "resize";
        this.activeHandle = "end";
        e.preventDefault();
        return;
      }
    } else {
      // For all other shapes, use the existing hit test handle logic
      const h = this.hitTestShapeHandle(shape, pos.x, pos.y);
      if (h) {
        this.dragMode = "resize";
        this.activeHandle = h;
        e.preventDefault();
        return;
      }
    }

    // 4‑b if click inside shape, start move
      if (this.isPointInsideShape(pos.x,pos.y,shape)){
        this.dragMode="move";
        this.offsetX = pos.x;
        this.offsetY = pos.y;
        e.preventDefault();
        return;
      }
    }

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

  mouseUpHandler = async (e: MouseEvent) => {
    const pos = this.getMousePos(e);
    if (this.dragMode !== "none") {
      this.dragMode = "none";
      this.activeHandle = null;
      this.canvas.style.cursor = "default";
      this.clearCanvas();  
      if (this.selectedShapeIndex != null) {
        const shape = this.existingShapes[this.selectedShapeIndex];
        this.safeSend(
          JSON.stringify({
            type: "shape:add",
            roomId: this.roomId?.toString(),
            shape,
          })
        );
      }
      return;
    }
    this.clicked = false;
    if (this.startX == null || this.startY == null) return;

  if (this.selectedTool === "line" || this.selectedTool === "arrow") {
    const shape: Shape = {
      id: this.genId(),
      type: this.selectedTool,
      startX: this.startX,
      startY: this.startY,
      endX: pos.x,
      endY: pos.y,
    };

    this.existingShapes.push(shape);
    this.selectedShapeIndex = this.existingShapes.length - 1;

    if (this.onToolChange) this.onToolChange("select");
    this.selectedTool = "select";

    this.clearCanvas();
    return;
  }
    if (this.selectedTool === "eraser" && this.hoveredForErase.length) {
      const doomedIds = this.hoveredForErase.map(i => this.existingShapes[i].id);
      if (this.isSolo) {
        this.hoveredForErase.sort((a, b) => b - a).forEach(i => this.existingShapes.splice(i, 1));
        this.hoveredForErase = [];
        this.clearCanvas();
        if (this.isSolo) this.scheduleLocalSave();
        return;
      }
      doomedIds.forEach(id =>
        this.safeSend(
          JSON.stringify({
            type: "shape:delete",
            roomId: this.roomId?.toString(),
            shapeId: id,
          }),
        ),
      );
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found. Skipping deletion requests.");
        return;
      }
      if (doomedIds.length === 0) return;
      try {
        await axios.delete(`${BACKEND_URL}/shapes/${doomedIds.join(",")}`, {
          headers: {
            Authorization: localStorage.getItem("token") ?? "",
          },
        });
        console.log("🗑️ Shapes deleted");
      } catch (err) {
        console.error("❌ Error deleting shapes:", err);
      }
      this.hoveredForErase.sort((a, b) => b - a).forEach(i => this.existingShapes.splice(i, 1));
      this.hoveredForErase = [];
      this.clearCanvas();
      return;
    }
    let shape: Shape | null = null;

    if (this.selectedTool === "rect") {
      if (this.startX === null || this.startY === null) return;
      const width = pos.x - this.startX;
      const height = pos.y - this.startY;
      const r = Math.min(
        this.MAX_CORNER_RADIUS,
        Math.abs(width) * 0.5,
        Math.abs(height) * 0.5
      );
      shape = {
        id: this.genId(),
        type: "rect",
        x: this.startX,
        y: this.startY,
        width: pos.x - this.startX,
        height: pos.y - this.startY,
        radius: r,
      };
    } else if (this.selectedTool === "diamond") {
      if (this.startX === null || this.startY === null) return;
      const width = pos.x - this.startX;
      const height = pos.y - this.startY;
      const cx = this.startX + width / 2;
      const cy = this.startY + height / 2;
      shape = {
        id: this.genId(),
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
        id: this.genId(),
        type: "circle",  
        rx,          
        ry,            
        centerX: cx,
        centerY: cy,
      };
    } else if (this.selectedTool === "pencil") {
      this.pencilPoints.push(pos);
      shape = {
        id: this.genId(),
        type: "pencil",
        points: this.pencilPoints,
      };
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
      this.clearCanvas();
      if (this.isSolo) this.scheduleLocalSave();
      if (!this.isSolo) {
        this.safeSend(
          JSON.stringify({
            type: "shape:add",
            roomId: this.roomId?.toString(),
            shape,
          })
        );
        this.scheduleWrite(shape);
      }
      this.startX = null;
      this.startY = null;
      this.endX = null;
      this.endY = null;
      this.pencilPoints = [];
    };

  mouseMoveHandler = (e: MouseEvent) => {
    const pos = this.getMousePos(e);
    if (this.selectedTool === "select" && this.selectedShapeIndex != null) {
      const shape = this.existingShapes[this.selectedShapeIndex];

    if (shape.type === "line" || shape.type === "arrow") {
      const dist = (x1: number, y1: number, x2: number, y2: number) =>
        Math.hypot(x2 - x1, y2 - y1);
      const handleRadius = 8;
      const { startX: x1, startY: y1, endX: x2, endY: y2 } = shape;
      const mouseX = pos.x;
      const mouseY = pos.y;

      const hoverStart = dist(mouseX, mouseY, x1, y1) < handleRadius + 2;
      const hoverEnd = dist(mouseX, mouseY, x2, y2) < handleRadius + 2;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const hoverMid = dist(mouseX, mouseY, midX, midY) < handleRadius + 2;

      let newHover: "start" | "end" | "mid" | null = null;
      if (hoverStart) newHover = "start";
      else if (hoverEnd) newHover = "end";
      else if (hoverMid) newHover = "mid";

      if (newHover !== this.hoveredEndpoint) {
        this.hoveredEndpoint = newHover;
        this.canvas.style.cursor = newHover ? "pointer" : "default";
        this.clearCanvas(); // trigger redraw with hover
      }
    } else {
      this.hoveredEndpoint = null;
      this.canvas.style.cursor = "default";
    }
  }

    /* ───────── DRAG‑TO‑MOVE / RESIZE ───────── */
    if (this.dragMode !== "none" && this.selectedShapeIndex != null) {
      const p = this.getMousePos(e);
      const s = this.existingShapes[this.selectedShapeIndex];
      if (this.dragMode === "move") {
        const dx = p.x - this.offsetX;
        const dy = p.y - this.offsetY;
        this.offsetX = p.x;
        this.offsetY = p.y;    
        switch (s.type) {
          case "rect":   s.x += dx; s.y += dy; break;
          case "circle": s.centerX += dx; s.centerY += dy; break;
          case "diamond":
            s.top.x += dx;    
            s.top.y += dy;
            s.right.x += dx;  
            s.right.y += dy;
            s.bottom.x += dx; 
            s.bottom.y += dy;
            s.left.x += dx;   
            s.left.y += dy;
            break;
          case "line":
          case "arrow":
            s.startX += dx;
            s.startY += dy;
            s.endX += dx;
            s.endY += dy;
            break;
          case "pencil":
          s.points = s.points.map((pt) => ({
            x: pt.x + dx,
            y: pt.y + dy
          }));
            break;
          case "text":
            s.x += dx;
            s.y += dy;
            break;
          }
        } else if (this.dragMode === "resize" && this.activeHandle) {
          if (s.type === "rect") {
            const h = this.activeHandle;
            if (h === "tl" || h === "bl") {
              const newW = s.x + s.width - p.x;
              s.x = p.x;
              s.width = newW;
            }
            if (h === "tl" || h === "tr") {
              const newH = s.y + s.height - p.y;
              s.y = p.y;
              s.height = newH;
            }
            if (h === "tr" || h === "br") s.width  = p.x - s.x;
            if (h === "bl" || h === "br") s.height = p.y - s.y;
          } else if (s.type === "circle") {
            s.rx = Math.abs(p.x - s.centerX);
            s.ry = Math.abs(p.y - s.centerY);
          }else if (s.type === "line" || s.type === "arrow") {
            if (this.activeHandle === "start") {
              s.startX = p.x;
              s.startY = p.y;
            } else if (this.activeHandle === "end") {
              s.endX = p.x;
              s.endY = p.y;
            }}
          }
        if (this.socket && this.roomId) {
          this.safeSend(JSON.stringify({
            type: "shape:add",
            roomId: this.roomId?.toString(),
            shape: s
          }));
        }
        this.scheduleWrite(s);
        this.clearCanvas(); 
        if (this.isSolo) this.scheduleLocalSave();
        return;
      }
      if (this.selectedTool === "eraser") {
        if (!this.clicked) return;
        for (let i = 0; i < this.existingShapes.length; i++) {
          if (this.isPointInsideShape(pos.x, pos.y, this.existingShapes[i]) && !this.hoveredForErase.includes(i)) {
            this.hoveredForErase.push(i);
          }
        }
        this.clearCanvas(); 
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
        if (this.selectedTool === "rect") {
          this.ctx.beginPath();
          const r = Math.min(
            this.MAX_CORNER_RADIUS,
            Math.abs(width)  * 0.5,
            Math.abs(height) * 0.5
          );
          this.ctx.roundRect(this.startX, this.startY, width, height, r);
          this.ctx.stroke();
        } else if (this.selectedTool === "diamond") {
          this.drawDiamond(top, right, bottom, left, 10);
        } else if (this.selectedTool === "circle") {
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
  };
}
