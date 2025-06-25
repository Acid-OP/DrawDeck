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
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      radius: number;
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
  socket: WebSocket;
  private isPointNearLineSegment(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
  tol: number
): boolean {
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
  const tol = 10; // tolerance margin

  switch (shape.type) {
    case "rect": {
      const withinX = x >= shape.x - tol && x <= shape.x + shape.width + tol;
      const withinY = y >= shape.y - tol && y <= shape.y + shape.height + tol;
      return withinX && withinY;
    }

    case "diamond": {
      const xs = [shape.top.x, shape.right.x, shape.bottom.x, shape.left.x];
      const ys = [shape.top.y, shape.right.y, shape.bottom.y, shape.left.y];
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return x >= minX - tol && x <= maxX + tol && y >= minY - tol && y <= maxY + tol;
    }

    case "line":
    case "arrow": {
      const x1 = shape.startX;
      const y1 = shape.startY;
      const x2 = shape.endX;
      const y2 = shape.endY;

      return this.isPointNearLineSegment(x, y, x1, y1, x2, y2, tol);
    }

    case "pencil": {
      const points = shape.points;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        if (this.isPointNearLineSegment(x, y, p1.x, p1.y, p2.x, p2.y, tol)) {
          return true;
        }
      }
      return false;
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
    this.existingShapes.forEach((shape) => {
      if (shape.type === "rect") {
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.beginPath();
        this.ctx.roundRect(shape.x, shape.y, shape.width, shape.height, 16);
        this.ctx.stroke();
      } else if (shape.type === "diamond") {
        this.drawDiamond(shape.top, shape.right, shape.bottom, shape.left);
      } else if (shape.type === "circle") {
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2
        );
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "line") {
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil") {
        this.drawPencilPath(shape.points);
      } else if (shape.type === "arrow") {
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.drawArrow(
          this.ctx,
          shape.startX,
          shape.startY,
          shape.endX,
          shape.endY
        );
      } else if (shape.type === "text") {
        this.ctx.fillStyle = "rgba(255, 255, 255)";
        this.ctx.font = "16px Arial";
        this.ctx.fillText(shape.text, shape.x, shape.y);
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
    this.clicked = true;
    const pos = this.getMousePos(e);

    if (this.selectedTool === "pencil") {
      this.pencilPoints = [pos];
    } else if (this.selectedTool === "eraser") {
      const pos = this.getMousePos(e);
      let erased = false;
      for (let i = this.existingShapes.length - 1; i >= 0; i--) {
        if (this.isPointInsideShape(pos.x, pos.y, this.existingShapes[i])) {
          this.existingShapes.splice(i, 1);
          erased = true;
          break;
      }
    }

    if(erased == true) this.clearCanvas();
    return; 
    } else {
      this.startX = pos.x;
      this.startY = pos.y;
      this.endX = pos.x;
      this.endY = pos.y;
    }
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
      const width = pos.x - this.startX;
      const height = pos.y - this.startY;
      const radius = Math.max(width, height) / 2;
      shape = {
        type: "circle",
        radius: radius,
        centerX: this.startX + radius,
        centerY: this.startY + radius,
      };
    } else if (this.selectedTool === "line") {
      if (
        this.startX === null ||
        this.startY === null ||
        this.endX === null ||
        this.endY === null
      )
        return;
      shape = {
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX: this.endX,
        endY: this.endY,
      };
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
    if (!this.clicked) return;

    const pos = this.getMousePos(e);

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
        const radius = Math.max(width, height) / 2;
        const centerX = this.startX + radius;
        const centerY = this.startY + radius;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
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
