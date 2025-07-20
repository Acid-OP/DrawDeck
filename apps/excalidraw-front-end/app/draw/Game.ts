import { Tool } from "@/components/Canvas";


    type BaseShape = { readonly id: string };

type Shape =
  | (BaseShape & StyleFields & {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      radius: number;
    })
  | (BaseShape & StyleFields & {
      type: "diamond";
      top: { x: number; y: number };
      right: { x: number; y: number };
      bottom: { x: number; y: number };
      left: { x: number; y: number };
    })
  | (BaseShape & StyleFields & {
      type: "circle";
      centerX: number;
      centerY: number;
      rx: number;
      ry: number;
    })
  | (BaseShape & StyleFields & {
      type: "line";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    })
  | (BaseShape & StyleFields & {
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    })
  | (BaseShape & StyleFields & {
      type: "pencil";
      points: { x: number; y: number }[];
    })
  | (BaseShape & StyleFields & {
      type: "text";
      x: number;
      y: number;
      text: string;
    });

interface StyleFields {
  strokeColor: string;
  backgroundColor: string;
  strokeWidth: number;
  strokeStyle: number | string;
  fillStyle: number | string;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public existingShapes: Shape[];
  private roomId?: string | null;
  private roomName?: string | null;
  private clicked: boolean;
  private startX: number | null = null;
  private startY: number | null = null;
  private endX: number | null = null;
  private endY: number | null = null;
  private selectedTool: Tool = "circle";
  private panOffsetX = 0;
  private panOffsetY = 0;
  private isPanning = false;
  private lastPanX = 0;
  private lastPanY = 0;
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
  public currentStrokeColor: string = '#1e1e1e';      // default black
  public currentBackgroundColor: string = 'transparent';
  public currentStrokeWidth: number = 2;
  public currentStrokeStyle: number = 0;
  public currentFillStyle: number = 0;
  private hoveredEndpoint: "start" | "end" | "mid" | null = null;
  private genId() {
    return crypto.randomUUID();
  }
  public setTheme(theme: "light" | "dark") {
  this.theme = theme;
  this.clearCanvas(); // Optional: re-render shapes with new theme colors if needed
}
  private theme: 'light' | 'dark' = 'dark';
  private localStorageTimeout: any = null;
  private isInit = false;
  private scheduleLocalSave() {
    if (this.localStorageTimeout) clearTimeout(this.localStorageTimeout);
    this.localStorageTimeout = setTimeout(() => {
      this.saveToLocalStorage();
    }, 1000);
  }
  private saveToLocalStorage() {
    try {
      const key = this.getLocalStorageKey();
      localStorage.setItem(key, JSON.stringify(this.existingShapes));
    } catch (err) {
      console.error("Failed to save shapes to localStorage", err);
    }
  }
  private scheduleWrite(shape: Shape) {
    if (!this.roomId) return;
    const key = `shapes_${this.roomId}`;
    localStorage.setItem(key, JSON.stringify(this.existingShapes));
  }

  private safeSend(payload: any) {
    if (this.isSolo || !this.socket || !this.roomId) return;
    this.socket.send(JSON.stringify(payload));
  }
  private broadcastShape(shape: Shape) {
    const key = this.getLocalStorageKey();

    if (this.isSolo) {
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = [...existing, shape];
      localStorage.setItem(key, JSON.stringify(updated));
    }

    this.existingShapes.push(shape);

    this.safeSend?.({
      type: "shape:add",
      roomName: this.roomId?.toString(),
      shape,
    });
  }

  hitTestShapeHandle(shape: Shape, mouseX: number, mouseY: number): "tl" | "tr" | "bl" | "br" | null {
    const handleSize = 10;
    const pad = 10;

    let x: number, y: number, width: number, height: number;

    if (shape.type === "rect") {
      x = shape.x;
      y = shape.y;
      width = shape.width;
      height = shape.height;
    } else if (shape.type === "circle") {
      x = shape.centerX - shape.rx;
      y = shape.centerY - shape.ry;
      width = shape.rx * 2;
      height = shape.ry * 2;
    } else if (shape.type === "diamond") {
      const minX = Math.min(shape.top.x, shape.right.x, shape.bottom.x, shape.left.x);
      const minY = Math.min(shape.top.y, shape.right.y, shape.bottom.y, shape.left.y);
      const maxX = Math.max(shape.top.x, shape.right.x, shape.bottom.x, shape.left.x);
      const maxY = Math.max(shape.top.y, shape.right.y, shape.bottom.y, shape.left.y);
      x = minX;
      y = minY;
      width = maxX - minX;
      height = maxY - minY;
    } else if (shape.type === "text") {
      x = shape.x;
      y = shape.y;
      width = 100;
      height = 30;
    } else if (shape.type === "pencil") {
      const xs = shape.points.map(p => p.x);
      const ys = shape.points.map(p => p.y);
      x = Math.min(...xs);
      y = Math.min(...ys);
      width = Math.max(...xs) - x;
      height = Math.max(...ys) - y;
    } else {
      return null;
    }
    const handles = {
      tl: { x: x - pad, y: y - pad },
      tr: { x: x + width + pad - handleSize, y: y - pad },
      bl: { x: x - pad, y: y + height + pad - handleSize },
      br: { x: x + width + pad - handleSize, y: y + height + pad - handleSize },
    };

    for (const [handle, pt] of Object.entries(handles)) {
      const localMouseX = mouseX - this.panOffsetX;
      const localMouseY = mouseY - this.panOffsetY;
      if (
        localMouseX >= pt.x &&
        localMouseX <= pt.x + handleSize &&
        localMouseY >= pt.y &&
        localMouseY <= pt.y + handleSize
      ){
        return handle as "tl" | "tr" | "bl" | "br";
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
    this.ctx.roundRect(cx - half-this.panOffsetX, cy - half-this.panOffsetY, size, size, 3);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  // ─── Circle Handle for Line/Arrow ──────────────────────
  private drawCircleHandle(x: number,y: number,isMid: boolean,r: number,isHovered: boolean = false) {
    const ctx = this.ctx;
    const px = x - this.panOffsetX;
    const py = y - this.panOffsetY;
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(px, py, r + 4, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(98, 80, 223, 0.4)"; // translucent purple outer ring on hover
      ctx.lineWidth = 6;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(px, py, r, 0, 2 * Math.PI);

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
private drawLineHandles(
  shape: Extract<Shape, { type: "line" | "arrow" }>,
  offsetX: number,
  offsetY: number
) {
  const { startX, startY, endX, endY } = shape;
  const r = 6;
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;

  const ux = dx / len, uy = dy / len;
  const startCx = startX - ux * r + offsetX;
  const startCy = startY - uy * r + offsetY;
  const endCx   = endX   + ux * r + offsetX;
  const endCy   = endY   + uy * r + offsetY;
  const midCx   = (startX + endX) / 2 + offsetX;
  const midCy   = (startY + endY) / 2 + offsetY;

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
    this.ctx.moveTo(fromX - this.panOffsetX, fromY - this.panOffsetY);
    this.ctx.lineTo(endX - this.panOffsetX, endY - this.panOffsetY);
    this.ctx.stroke();
  }

  // ─── Selection Box with External Handles ────────────────
  private drawSelectionBox(shape: Shape) {
    this.ctx.save();
    const offsetX = this.panOffsetX;
    const offsetY = this.panOffsetY;
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
  const w = (x2 - x1) + pad * 2;
  const h = (y2 - y1) + pad * 2;

  const inset = handleSize / 2;

  this.ctx.beginPath();
  this.ctx.moveTo(x + inset + offsetX, y + offsetY);                 // top
  this.ctx.lineTo(x + w - inset + offsetX, y + offsetY);

  this.ctx.moveTo(x + w + offsetX, y + inset + offsetY);             // right
  this.ctx.lineTo(x + w + offsetX, y + h - inset + offsetY);

  this.ctx.moveTo(x + w - inset + offsetX, y + h + offsetY);         // bottom
  this.ctx.lineTo(x + inset + offsetX, y + h + offsetY);

  this.ctx.moveTo(x + offsetX, y + h - inset + offsetY);             // left
  this.ctx.lineTo(x + offsetX, y + inset + offsetY);

  this.ctx.stroke();

  const handles = [
    { x: x,     y: y },
    { x: x + w, y: y },
    { x: x + w, y: y + h },
    { x: x,     y: y + h },
  ];

  for (const { x: hx, y: hy } of handles) {
    this.drawHandleBox(hx + offsetX, hy + offsetY);
  }

  this.ctx.restore();
  return;
}


if (shape.type === "circle") {

  const x = shape.centerX - shape.rx - pad;
  const y = shape.centerY - shape.ry - pad;
  const w = shape.rx * 2 + pad * 2;
  const h = shape.ry * 2 + pad * 2;

  const inset = handleSize / 2;

  this.ctx.beginPath();
  this.ctx.moveTo(x + inset + offsetX, y + offsetY);                  // top
  this.ctx.lineTo(x + w - inset + offsetX, y + offsetY);

  this.ctx.moveTo(x + w + offsetX, y + inset + offsetY);              // right
  this.ctx.lineTo(x + w + offsetX, y + h - inset + offsetY);

  this.ctx.moveTo(x + w - inset + offsetX, y + h + offsetY);          // bottom
  this.ctx.lineTo(x + inset + offsetX, y + h + offsetY);

  this.ctx.moveTo(x + offsetX, y + h - inset + offsetY);              // left
  this.ctx.lineTo(x + offsetX, y + inset + offsetY);
  this.ctx.stroke();

  const handles = [
    { x: x,     y: y },
    { x: x + w, y: y },
    { x: x + w, y: y + h },
    { x: x,     y: y + h },
  ];
  for (const { x: hx, y: hy } of handles) {
    this.drawHandleBox(hx + offsetX, hy + offsetY);
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

  const inset = handleSize / 2;

  this.ctx.beginPath();
  this.ctx.moveTo(minX + inset + offsetX, minY + offsetY);           
  this.ctx.lineTo(maxX - inset + offsetX, minY + offsetY);

  this.ctx.moveTo(maxX + offsetX, minY + inset + offsetY);           
  this.ctx.lineTo(maxX + offsetX, maxY - inset + offsetY);

  this.ctx.moveTo(maxX - inset + offsetX, maxY + offsetY);           
  this.ctx.lineTo(minX + inset + offsetX, maxY + offsetY);

  this.ctx.moveTo(minX + offsetX, maxY - inset + offsetY);           
  this.ctx.lineTo(minX + offsetX, minY + inset + offsetY);

  this.ctx.stroke();

  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
  for (const { x: hx, y: hy } of corners) {
    this.drawHandleBox(hx + offsetX, hy + offsetY);
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

  const inset = handleSize / 2;

  this.ctx.beginPath();
  this.ctx.moveTo(x + inset + offsetX, y + offsetY);          
  this.ctx.lineTo(x + w - inset + offsetX, y + offsetY);

  this.ctx.moveTo(x + w + offsetX, y + inset + offsetY);     
  this.ctx.lineTo(x + w + offsetX, y + h - inset + offsetY);

  this.ctx.moveTo(x + w - inset + offsetX, y + h + offsetY);  
  this.ctx.lineTo(x + inset + offsetX, y + h + offsetY);

  this.ctx.moveTo(x + offsetX, y + h - inset + offsetY);       
  this.ctx.lineTo(x + offsetX, y + inset + offsetY);
  this.ctx.stroke();

  const corners = [
    { x: x,     y: y },
    { x: x + w, y: y },
    { x: x + w, y: y + h },
    { x: x,     y: y + h },
  ];
  for (const { x: hx, y: hy } of corners) {
    this.drawHandleBox(hx + offsetX, hy + offsetY);
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
  const inset = handleSize / 2;

  this.ctx.save(); // Save context before making drawing state changes

  // Draw selection rectangle
  this.ctx.beginPath();
  this.ctx.moveTo(minX + inset + offsetX, minY + inset + offsetY);
  this.ctx.lineTo(maxX - inset + offsetX, minY + inset + offsetY);
  this.ctx.lineTo(maxX - inset + offsetX, maxY - inset + offsetY);
  this.ctx.lineTo(minX + inset + offsetX, maxY - inset + offsetY);
  this.ctx.closePath();
  this.ctx.stroke();

  // Draw selection handles at corners
  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
  for (const { x: hx, y: hy } of corners) {
    this.drawHandleBox(hx + offsetX, hy + offsetY);
  }

  this.ctx.restore();
  return;
}


if (shape.type === "line" || shape.type === "arrow") {
      this.drawLineHandles(shape, this.panOffsetX, this.panOffsetY);
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
  private getLocalStorageKey(): string {
  return this.isSolo ? "solo_shapes" : `shapes_${this.roomId}`;
}

  constructor(canvas: HTMLCanvasElement, roomName: string | null, socket: WebSocket | null , isSolo:boolean=false , theme: "light" | "dark" ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.isSolo = isSolo;
    this.roomName = roomName;
    this.roomId = roomName;
    this.socket = socket;
    this.theme = theme;
    this.clearCanvas();
    this.clicked = false;
    this.init();
    if (!this.isSolo && this.socket) {
    this.initHandlers(); 
    }
    this.initMouseHandlers();
  }
  setStrokeColor(color: string) {
    this.currentStrokeColor = color;
  }
  setBackgroundColor(color: string) {
    this.currentBackgroundColor = color;
  }
  setStrokeWidth(width: number) {
    this.currentStrokeWidth = width;
  }
  setStrokeStyle(style: number) {
    this.currentStrokeStyle = style; 
  }
  setFillStyle(style: number) {
    this.currentFillStyle = style;
  }

  clearShapes() {
    const key = this.getLocalStorageKey();
    localStorage.removeItem(key);
    this.existingShapes = [];
    this.clearCanvas();
  }

  isOnSelectionBoxBorder(shape: Shape, x: number, y: number): boolean {
    const pad = 8;
    const tolerance = 6;
    let boxX = 0, boxY = 0, boxW = 0, boxH = 0;

    // ✅ Apply pan offset to the input point
    x -= this.panOffsetX;
    y -= this.panOffsetY;

    if (shape.type === "rect") {
      const x1 = Math.min(shape.x, shape.x + shape.width);
      const y1 = Math.min(shape.y, shape.y + shape.height);
      const x2 = Math.max(shape.x, shape.x + shape.width);
      const y2 = Math.max(shape.y, shape.y + shape.height);

      boxX = x1 - pad;
      boxY = y1 - pad;
      boxW = (x2 - x1) + pad * 2;
      boxH = (y2 - y1) + pad * 2;
    }

    const onLeft   = Math.abs(x - boxX) < tolerance && y >= boxY && y <= boxY + boxH;
    const onRight  = Math.abs(x - (boxX + boxW)) < tolerance && y >= boxY && y <= boxY + boxH;
    const onTop    = Math.abs(y - boxY) < tolerance && x >= boxX && x <= boxX + boxW;
    const onBottom = Math.abs(y - (boxY + boxH)) < tolerance && x >= boxX && x <= boxX + boxW;

    return onLeft || onRight || onTop || onBottom;
  }

  isPointInsideSelectionBox(shape: Shape, x: number, y: number): boolean {
    const pad = 8;
    let boxX = 0, boxY = 0, boxW = 0, boxH = 0;

    // ✅ Apply pan offset to bring mouse coordinates into world space
    x -= this.panOffsetX;
    y -= this.panOffsetY;

    if (shape.type === "rect") {
      const x1 = Math.min(shape.x, shape.x + shape.width);
      const y1 = Math.min(shape.y, shape.y + shape.height);
      const x2 = Math.max(shape.x, shape.x + shape.width);
      const y2 = Math.max(shape.y, shape.y + shape.height);
      boxX = x1 - pad;
      boxY = y1 - pad;
      boxW = (x2 - x1) + pad * 2;
      boxH = (y2 - y1) + pad * 2;
    } else if (shape.type === "circle") {
      boxX = shape.centerX - shape.rx - pad;
      boxY = shape.centerY - shape.ry - pad;
      boxW = shape.rx * 2 + pad * 2;
      boxH = shape.ry * 2 + pad * 2;
    } else if (shape.type === "diamond") {
      const xs = [shape.top.x, shape.right.x, shape.bottom.x, shape.left.x];
      const ys = [shape.top.y, shape.right.y, shape.bottom.y, shape.left.y];
      const minX = Math.min(...xs) - pad;
      const maxX = Math.max(...xs) + pad;
      const minY = Math.min(...ys) - pad;
      const maxY = Math.max(...ys) + pad;
      boxX = minX;
      boxY = minY;
      boxW = maxX - minX;
      boxH = maxY - minY;
    } else if (shape.type === "text") {
      const width = 100;
      const height = 30;
      boxX = shape.x - pad / 2;
      boxY = shape.y - height + pad / 2;
      boxW = width + pad;
      boxH = height + pad;
    } else if (shape.type === "pencil") {
      const xs = shape.points.map(p => p.x);
      const ys = shape.points.map(p => p.y);
      const minX = Math.min(...xs) - pad;
      const maxX = Math.max(...xs) + pad;
      const minY = Math.min(...ys) - pad;
      const maxY = Math.max(...ys) + pad;
      boxX = minX;
      boxY = minY;
      boxW = maxX - minX;
      boxH = maxY - minY;
    }

    return x >= boxX && x <= boxX + boxW && y >= boxY && y <= boxY + boxH;
  }  

  addTextShape(x: number, y: number, text: string) {
  const shape = {
    id: this.genId(),
    type: "text" as const,
    x,
    y,
    text,
    strokeColor: this.currentStrokeColor,
    backgroundColor: this.currentBackgroundColor,
    strokeWidth: this.currentStrokeWidth,
    strokeStyle: this.currentStrokeStyle,
    fillStyle: this.currentFillStyle,
  };
  this.existingShapes.push(shape);
  if (this.isSolo) {
    this.scheduleLocalSave();
  } else {
    this.broadcastShape(shape);
  }
}


  getMousePos = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left + this.panOffsetX,
      y: e.clientY - rect.top + this.panOffsetY,
    };
  };
  
  private isPointInsideShape(x: number, y: number, shape: Shape): boolean {
    const pad = 6;

    // ✅ Convert screen coords to world coords
    x -= this.panOffsetX;
    y -= this.panOffsetY;

    if (shape.type === "rect") {
      const x1 = Math.min(shape.x, shape.x + shape.width);
      const y1 = Math.min(shape.y, shape.y + shape.height);
      const x2 = Math.max(shape.x, shape.x + shape.width);
      const y2 = Math.max(shape.y, shape.y + shape.height);
      return (
        x >= x1 - pad &&
        x <= x2 + pad &&
        y >= y1 - pad &&
        y <= y2 + pad
      );
    }

    if (shape.type === "circle") {
      const dx = x - shape.centerX;
      const dy = y - shape.centerY;
      const norm =
        (dx * dx) / (shape.rx * shape.rx) + (dy * dy) / (shape.ry * shape.ry);
      return norm <= 1.1;
    }

    if (shape.type === "diamond") {
      const xs = [shape.top.x, shape.right.x, shape.bottom.x, shape.left.x];
      const ys = [shape.top.y, shape.right.y, shape.bottom.y, shape.left.y];
      const minX = Math.min(...xs) - pad;
      const maxX = Math.max(...xs) + pad;
      const minY = Math.min(...ys) - pad;
      const maxY = Math.max(...ys) + pad;
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }

    if (shape.type === "text") {
      const width = 100;
      const height = 30;
      return (
        x >= shape.x &&
        x <= shape.x + width &&
        y <= shape.y &&
        y >= shape.y - height
      );
    }

    if (shape.type === "pencil") {
      for (let i = 0; i < shape.points.length - 1; i++) {
        if (
          this.isPointNearLineSegment(
            x,
            y,
            shape.points[i].x,
            shape.points[i].y,
            shape.points[i + 1].x,
            shape.points[i + 1].y,
            pad
          )
        ) {
          return true;
        }
      }
      return false;
    }

    if (shape.type === "line" || shape.type === "arrow") {
      return this.isPointNearLineSegment(
        x,
        y,
        shape.startX,
        shape.startY,
        shape.endX,
        shape.endY,
        pad
      );
    }

    return false;
  }
  drawDiamond(
    top: { x: number; y: number },
    right: { x: number; y: number },
    bottom: { x: number; y: number },
    left: { x: number; y: number },
    strokeStyle: string,
    fillStyle: string = "transparent",
    dashPattern: number[] = [],
    lineWidth: number = 2,
  ): void {
    const offsetX = this.panOffsetX;
    const offsetY = this.panOffsetY;

    this.ctx.save();
    this.ctx.strokeStyle = strokeStyle;
    this.ctx.fillStyle = fillStyle;
    this.ctx.setLineDash(dashPattern);
    this.ctx.lineWidth = lineWidth;

    this.ctx.beginPath();
    this.ctx.moveTo(top.x - offsetX, top.y - offsetY);
    this.ctx.lineTo(right.x - offsetX, right.y - offsetY);
    this.ctx.lineTo(bottom.x - offsetX, bottom.y - offsetY);
    this.ctx.lineTo(left.x - offsetX, left.y - offsetY);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);

  }
  setTool(tool: Tool) {
    this.selectedTool = tool;
    this.hoveredForErase = [];
  }
  
  async init() {
  if (this.isSolo) {
    const key = this.getLocalStorageKey();
    const saved = localStorage.getItem(key);
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

  const saved = localStorage.getItem(`shapes_${this.roomId}`);
  const shapes: Shape[] = saved ? JSON.parse(saved) : [];

  const seenIds = new Set(this.existingShapes.map(s => s.id));
  shapes.forEach((shape: Shape) => {
    if (!seenIds.has(shape.id)) {
      this.existingShapes.push(shape);
    }
  });

  this.clearCanvas();
}

  initHandlers() {
    if (this.isSolo || !this.socket || !this.roomId) return;

    this.socket.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.roomName !== this.roomId?.toString()) return;
    switch (msg.type) {
      case "shape:add": {
        const shape = msg.shape;
        const exists = this.existingShapes.some(s => s.id === shape.id);
        if (!exists) {
          this.existingShapes.push(shape);
          this.clearCanvas();
        }
        break;
      }

      case "shape:delete": {
        const shapeId = msg.shapeId;
        const index = this.existingShapes.findIndex(s => s.id === shapeId);
        if (index !== -1) {
          this.deleteShapeByIndex(index);
        }
        break;
      }
    }
  };
}


deleteShapeById(id: string) {
  this.existingShapes = this.existingShapes.filter(shape => shape.id !== id);
  this.saveToLocalStorage();
}

public deleteShapeByIndex(index: number) {
  console.log("hellloooo")
  const shape = this.existingShapes[index];
  if (!shape) return;
  this.existingShapes.splice(index, 1);

  if (this.isSolo) {
  this.scheduleLocalSave();
} else {
  this.scheduleWriteAll();
  this.safeSend({
    type: "shape:delete",
    roomName: this.roomId?.toString(),
    shapeId: shape.id,
  });
}

  this.clearCanvas();
}
  getDashArray(style: number | string): number[] {
    if (style === 1 || style === "dashed") return [8, 6];
    if (style === 2 || style === "dotted") return [2, 6];
    return [];
  }

  clearCanvas() {
    const offsetX = this.panOffsetX;
    const offsetY = this.panOffsetY;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.theme === "dark" ? "#121212" : "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      // Util: map style index/enum to dash arrays
    function getDashArray(style: number | string): number[] {
      if (style === 1 || style === "dashed") return [8, 6];
      if (style === 2 || style === "dotted") return [2, 6];
      return [];
    }
    this.existingShapes.forEach((shape , idx) => {
      const isHovered = this.selectedTool === "eraser" &&
      this.hoveredForErase?.includes(idx); 
      const strokeCol = isHovered 
      ? "rgba(255,80,80)" 
      : (shape as any).strokeColor ?? (this.theme === 'dark' ? "#ffffff" : "#000000");
      const fillCol = (shape as any).backgroundColor ?? "transparent";
      const lineWidth = (shape as any).strokeWidth ?? 2;
      const dashArray = getDashArray((shape as any).strokeStyle);
      this.ctx.save(); // Save graphics state
      this.ctx.strokeStyle = strokeCol;
      this.ctx.fillStyle = fillCol;
      this.ctx.lineWidth = lineWidth;
      this.ctx.setLineDash(dashArray);

      if (shape.type === "rect") {
        this.ctx.strokeStyle = strokeCol;
        const r = Math.min(
          this.MAX_CORNER_RADIUS,
          Math.abs(shape.width) * 0.5,
          Math.abs(shape.height) * 0.5
        );
        this.ctx.beginPath();
        this.ctx.roundRect(
        shape.x - offsetX,
        shape.y - offsetY,
        shape.width,
        shape.height,
        r
      );
        this.ctx.stroke();
      } else if (shape.type === "diamond") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.fillStyle = fillCol;
         this.drawDiamond(
        {
          x: shape.top.x - offsetX,
          y: shape.top.y - offsetY,
        },
        {
          x: shape.right.x - offsetX,
          y: shape.right.y - offsetY,
        },
        {
          x: shape.bottom.x - offsetX,
          y: shape.bottom.y - offsetY,
        },
        {
          x: shape.left.x - offsetX,
          y: shape.left.y - offsetY,
        },
        strokeCol,
        fillCol,
        dashArray,
        lineWidth
      );

      } else if (shape.type === "circle") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.fillStyle = fillCol;
        this.ctx.beginPath();
        this.ctx.ellipse(
        shape.centerX - offsetX,
        shape.centerY - offsetY,
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
        this.ctx.fillStyle = fillCol;
        const offsetPoints = shape.points.map((p) => ({
          x: p.x - offsetX,
          y: p.y - offsetY,
        }));
        this.drawPencilPath(offsetPoints, 0, 0);
      } else if (shape.type === "line" || shape.type === "arrow") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.fillStyle = fillCol;
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX - offsetX, shape.startY - offsetY);
        this.ctx.lineTo(shape.endX - offsetX, shape.endY - offsetY);
        this.ctx.stroke();
        this.ctx.closePath();
        if (shape.type === "arrow") {
          this.drawArrow(
            this.ctx,
            shape.startX - offsetX,
            shape.startY - offsetY,
            shape.endX - offsetX,
            shape.endY - offsetY,
            strokeCol
          );
        }
        if (
          this.selectedTool === "select" &&
          this.selectedShapeIndex === this.existingShapes.indexOf(shape)
        ) {
          this.drawLineHandles(shape, this.panOffsetX, this.panOffsetY);

        }
      } else if (shape.type === "text") {
        this.ctx.fillStyle = (shape as any).strokeColor ?? (this.theme === "dark" ? "#fff" : "#000");
        this.ctx.font = "16px Arial";
        this.ctx.fillText(shape.text, shape.x - offsetX, shape.y - offsetY);
      }
 if (
  this.selectedTool === "select" &&
  this.selectedShapeIndex !== null &&
  this.existingShapes[this.selectedShapeIndex] === shape
) {
  this.drawSelectionBox(shape);
}


      this.ctx.restore(); // Restore previous state (clears lineDash etc.)
      });
    }
    drawPencilPath(
      points: { x: number; y: number }[],
      offsetX: number,
      offsetY: number
    ) {
      if (!points || points.length < 2) return;
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x - offsetX, points[0].y - offsetY);
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x - offsetX, points[i].y - offsetY);
      }
      this.ctx.stroke();
      this.ctx.closePath();
    }
  mouseDownHandler = (e: MouseEvent) => {
    if (this.selectedTool === "hand") {
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      this.clearCanvas();
      return;
    }
    const pos = this.getMousePos(e);
    if (this.selectedTool==="select" && this.selectedShapeIndex!=null){
      const shape=this.existingShapes[this.selectedShapeIndex];
      if (!shape) return; 
      if (shape.type === "line" || shape.type === "arrow") {
      const dist = (x1: number, y1: number, x2: number, y2: number) =>
        Math.hypot(x2 - x1, y2 - y1);
      const handleRadius = 8;

      const hoverStart = dist(pos.x, pos.y, shape.startX, shape.startY) < handleRadius;
      const hoverEnd = dist(pos.x, pos.y, shape.endX, shape.endY) < handleRadius;
      const midX = (shape.startX + shape.endX) / 2;
      const midY = (shape.startY + shape.endY) / 2;
      const hoverMid = dist(pos.x, pos.y, midX, midY) < handleRadius;
      if (hoverStart) {
        this.dragMode = "resize";
        this.activeHandle = "start";
        e.preventDefault();
        return;
      }else if (hoverMid) {
        this.dragMode = "move"; // 👈 this enables dragging
        this.offsetX = pos.x;
        this.offsetY = pos.y;
        e.preventDefault();
        return;
      }else if (hoverEnd) {
        this.dragMode = "resize";
        this.activeHandle = "end";
        e.preventDefault();
        return;
      }} else {
      const h = this.hitTestShapeHandle(shape, pos.x, pos.y);
      if (h) {
        this.dragMode = "resize";
        this.activeHandle = h;
        e.preventDefault();
        return;
      }
      if (
        this.isPointInsideSelectionBox(shape, pos.x, pos.y) &&
        !this.isPointInsideShape(pos.x, pos.y, shape)
      )
      {
        this.dragMode = "resize";
        this.activeHandle = null;
        e.preventDefault();
        return;
      }
      
      if (this.isPointInsideShape(pos.x, pos.y, shape)) {
        this.dragMode = "move";
        this.offsetX = pos.x;
        this.offsetY = pos.y;
        e.preventDefault();
        return;
      }}
    }
    if (this.selectedTool === "select") {
      for (let i = this.existingShapes.length - 1; i >= 0; i--) {
        if (this.isPointInsideShape(pos.x, pos.y, this.existingShapes[i])) {
          this.selectedShapeIndex = i;
          this.dragMode = "resize";
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
  const logicalX = pos.x + this.panOffsetX;
  const logicalY = pos.y + this.panOffsetY;
  let deleted = false;
  let deletedShape: Shape | null = null;

  for (let i = this.existingShapes.length - 1; i >= 0; i--) {
    if (this.isPointInsideShape(logicalX, logicalY, this.existingShapes[i])) {
      deletedShape = this.existingShapes[i];
      this.deleteShapeByIndex(i); // Removes from array, redraws, handles solo/collab storage
      deleted = true;

      // Only one shape should be erased per click
      break;
    }
  }

  if (deleted) {
    this.clearCanvas(); // Optional: if your deleteShapeByIndex doesn't already call this

    // Broadcast delete if not in solo mode and shape was found
    if (!this.isSolo && deletedShape) {
      this.safeSend(
        JSON.stringify({
          type: "shape:delete",
          roomName: this.roomId?.toString(),
          shapeId: deletedShape.id,
        })
      );
      this.scheduleWriteAll();
    } else if (this.isSolo) {
      // For local only, ensure storage updates if deleteShapeByIndex doesn't do it
      this.scheduleLocalSave?.();
    }
  }

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
  endY: number,
  strokeStyle: string,
  fillStyle: string = strokeStyle,
  lineWidth: number = 2,
  dashPattern: number[] = [],
  offsetX: number = 0,
  offsetY: number = 0
): void {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.fillStyle = fillStyle;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dashPattern);

  const headLength = 10;
  const angle = Math.atan2(endY - startY, endX - startX);

  const arrowTipX = endX - offsetX;
  const arrowTipY = endY - offsetY;
  const leftX = arrowTipX - headLength * Math.cos(angle - Math.PI / 6);
  const leftY = arrowTipY - headLength * Math.sin(angle - Math.PI / 6);
  const rightX = arrowTipX - headLength * Math.cos(angle + Math.PI / 6);
  const rightY = arrowTipY - headLength * Math.sin(angle + Math.PI / 6);

  // Draw the main arrow shaft
  ctx.beginPath();
  ctx.moveTo(startX - offsetX, startY - offsetY);
  ctx.lineTo(arrowTipX, arrowTipY);
  ctx.stroke();

  // Draw and fill the arrowhead
  ctx.beginPath();
  ctx.moveTo(arrowTipX, arrowTipY);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}


private scheduleWriteAll() {
  if (!this.roomId) return;
  const key = `shapes_${this.roomId}`;
  localStorage.setItem(key, JSON.stringify(this.existingShapes));
}

mouseUpHandler = async (e: MouseEvent) => {
  console.log("[Debug] mouseUpHandler called. Current tool:", this.selectedTool);
  const pos = this.getMousePos(e);

  if (this.selectedTool === "hand" && this.isPanning) {
    this.isPanning = false;
    return;
  }

  if (this.dragMode !== "none") {
    this.dragMode = "none";
    this.activeHandle = null;
    this.canvas.style.cursor = "default";
    this.clearCanvas();
    if (this.selectedShapeIndex != null) {
      const shape = this.existingShapes[this.selectedShapeIndex];
      if (this.isSolo) {
        this.scheduleLocalSave();
      } else {
        this.safeSend(
          JSON.stringify({
            type: "shape:add",
            roomName: this.roomId?.toString(),
            shape,
          })
        );
      }
    }
    return;
  }
  this.clicked = false;

// ---- Special handling: Pencil (FIX) ----
if (this.selectedTool === "pencil") {
  console.log("[Debug] mouseUp pencil. Points:", this.pencilPoints);
  if (!this.pencilPoints || this.pencilPoints.length < 2) {
    this.pencilPoints = [];
    return;
  }

  // Compose and commit the pencil shape
  const adjustedPoints = this.pencilPoints.map(p => ({
    x: p.x + this.panOffsetX,
    y: p.y + this.panOffsetY,
  }));

  // Ensure last mouse position is included
  const last = adjustedPoints[adjustedPoints.length - 1];
  if (last.x !== pos.x + this.panOffsetX || last.y !== pos.y + this.panOffsetY) {
    adjustedPoints.push({
      x: pos.x + this.panOffsetX,
      y: pos.y + this.panOffsetY
    });
  }

  const pencilShape: Shape = {
    id: this.genId(),
    type: "pencil",
    points: [...adjustedPoints],
    strokeColor: this.currentStrokeColor,
    backgroundColor: this.currentBackgroundColor,
    strokeWidth: this.currentStrokeWidth,
    strokeStyle: this.currentStrokeStyle,
    fillStyle: this.currentFillStyle,
  };

  this.existingShapes.push(pencilShape);
  console.log("[Debug] Pencil shape committed to array", pencilShape);

  if (!this.isSolo) {
    this.broadcastShape(pencilShape);
    console.log("[Debug] Pencil shape broadcasted", pencilShape);
  }

  this.scheduleLocalSave();

  // ✅ Auto-select the newly drawn pencil
  this.selectedTool = "select";
  this.selectedShapeIndex = this.existingShapes.length - 1; // Index, not ID
  if (this.onToolChange) this.onToolChange("select");
  this.clearCanvas(); // Force redraw to show bounding box

  // Reset drawing state
  this.startX = null;
  this.startY = null;
  this.endX = null;
  this.endY = null;
  this.pencilPoints = [];

  return;
}


  // ---- All other tool logic remains as previous ----
  if (this.startX == null || this.startY == null) return;
  if (this.selectedTool === "line" || this.selectedTool === "arrow") {
    const shape: Shape = {
      id: this.genId(),
      type: this.selectedTool,
      startX: this.startX,
      startY: this.startY,
      endX: pos.x,
      endY: pos.y,
      strokeColor: this.currentStrokeColor,
      backgroundColor: this.currentBackgroundColor,
      strokeWidth: this.currentStrokeWidth,
      strokeStyle: this.currentStrokeStyle,
      fillStyle: this.currentFillStyle,
    };

    this.existingShapes.push(shape);
    if (!this.isSolo) {
      this.broadcastShape(shape); // ✅ UNCOMMENT THIS
    }
    this.scheduleLocalSave();

    this.selectedShapeIndex = this.existingShapes.length - 1;

    if (this.onToolChange) this.onToolChange("select");
    this.selectedTool = "select";
    this.clearCanvas();
    return;
  }

  if (this.selectedTool === "eraser") {
    this.clicked = false; // End gesture
    // No deletion needed if all is done in mouse move
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
      x: this.startX + this.panOffsetX,
      y: this.startY + this.panOffsetY,
      width: width,
      height: height,
      radius: r,
      strokeColor: this.currentStrokeColor,
      backgroundColor: this.currentBackgroundColor,
      strokeWidth: this.currentStrokeWidth,
      strokeStyle: this.currentStrokeStyle,
      fillStyle: this.currentFillStyle,
    };

  } else if (this.selectedTool === "diamond") {
    if (this.startX === null || this.startY === null) return;

    const width = pos.x - this.startX;
    const height = pos.y - this.startY;
    const cx = this.startX + width / 2 + this.panOffsetX;
    const cy = this.startY + height / 2 + this.panOffsetY;

    shape = {
      id: this.genId(),
      type: "diamond",
      top: { x: cx, y: cy - height / 2 },
      right: { x: cx + width / 2, y: cy },
      bottom: { x: cx, y: cy + height / 2 },
      left: { x: cx - width / 2, y: cy },
      strokeColor: this.currentStrokeColor,
      backgroundColor: this.currentBackgroundColor,
      strokeWidth: this.currentStrokeWidth,
      strokeStyle: this.currentStrokeStyle,
      fillStyle: this.currentFillStyle,
    };

  } else if (this.selectedTool === "circle") {
    if (this.startX === null || this.startY === null) return;
    const rx = Math.abs((pos.x - this.startX) / 2);
    const ry = Math.abs((pos.y - this.startY) / 2);
    const cx = this.startX + (pos.x - this.startX) / 2 + this.panOffsetX;
    const cy = this.startY + (pos.y - this.startY) / 2 + this.panOffsetY;
    shape = {
      id: this.genId(),
      type: "circle",
      rx,
      ry,
      centerX: cx,
      centerY: cy,
      strokeColor: this.currentStrokeColor,
      backgroundColor: this.currentBackgroundColor,
      strokeWidth: this.currentStrokeWidth,
      strokeStyle: this.currentStrokeStyle,
      fillStyle: this.currentFillStyle,
    };
  } else if (this.selectedTool === "text") {
    if ((window as any).justBlurredTextInput) return;
    setTimeout(() => {
      if (this.onTextInsert) {
        this.onTextInsert(pos.x + this.panOffsetX, pos.y + this.panOffsetY);
      }
    }, 0);
    return;
  }

if (!shape) return;

this.existingShapes.push(shape);

if (!this.isSolo) {
  this.broadcastShape(shape);
}
this.scheduleLocalSave();

// ✅ Auto-select the shape (except for arrow/line, handled above)
this.selectedShapeIndex = this.existingShapes.length - 1;
this.selectedTool = "select";
if (this.onToolChange) this.onToolChange("select");
this.clearCanvas(); // to show the selection box

this.startX = null;
this.startY = null;
this.endX = null;
this.endY = null;
this.pencilPoints = [];
return;

};



  mouseMoveHandler = (e: MouseEvent) => {
    if (this.selectedTool === "hand" && this.isPanning) {
      const dx = e.clientX - this.lastPanX;
      const dy = e.clientY - this.lastPanY;
      this.panOffsetX -= dx;
      this.panOffsetY -= dy;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      this.clearCanvas();
      return;
    }

    const pos = this.getMousePos(e);
    const strokeCol = this.currentStrokeColor;
    const fillCol = this.currentBackgroundColor;
    const lineWidth = this.currentStrokeWidth;
    const dashArray = this.getDashArray(this.currentStrokeStyle); 

    if (this.selectedTool === "select" && this.selectedShapeIndex != null) {
      const shape = this.existingShapes[this.selectedShapeIndex];
      if (!shape) return;
      if (shape.type === "line" || shape.type === "arrow") {
        const dist = (x1: number, y1: number, x2: number, y2: number) =>
          Math.hypot(x2 - x1, y2 - y1);
          const handleRadius = 8;

          const x1 = shape.startX - this.panOffsetX;
          const y1 = shape.startY - this.panOffsetY;
          const x2 = shape.endX - this.panOffsetX;
          const y2 = shape.endY - this.panOffsetY;

          const mouseX = pos.x;
          const mouseY = pos.y;

          this.ctx.strokeStyle = strokeCol;

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
            if (newHover === "start" || newHover === "end") {
              this.canvas.style.cursor = "crosshair";
            } else if (newHover === "mid") {
              this.canvas.style.cursor = "move";
            } else {
              this.canvas.style.cursor = "default";
            }
            this.clearCanvas();
          }
        } else {
          this.ctx.strokeStyle = strokeCol;
          this.hoveredEndpoint = null;
          this.canvas.style.cursor = "default";
        }
        if (this.selectedShapeIndex != null && shape.type !== "line" && shape.type !== "arrow") {
          // Correct mouse position relative to panned canvas
          const offsetX = this.panOffsetX;
          const offsetY = this.panOffsetY;
          const h = this.hitTestShapeHandle(shape, pos.x + offsetX, pos.y + offsetY);
          if (h) {
            const cursorMap: Record<"tl" | "tr" | "bl" | "br", string> = {
              tl: "nwse-resize",
              br: "nwse-resize",
              tr: "nesw-resize",
              bl: "nesw-resize",
            };
            this.canvas.style.cursor = cursorMap[h];
            this.activeHandle = h;
            this.clearCanvas();
          } else if (this.isPointInsideShape(pos.x + offsetX, pos.y + offsetY, shape)) {
            this.canvas.style.cursor = "move";
          } else {
            this.canvas.style.cursor = "default";
          }
        }
      }
      /* ───────── DRAG‑TO‑MOVE / RESIZE ───────── */
      if (this.dragMode !== "none" && this.selectedShapeIndex != null) {
        const p = this.getMousePos(e);
        p.x += this.panOffsetX;
        p.y += this.panOffsetY;
        
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
              s.top.x += dx;    s.top.y += dy;
              s.right.x += dx;  s.right.y += dy;
              s.bottom.x += dx; s.bottom.y += dy;
              s.left.x += dx;   s.left.y += dy;
              break;
            case "line":
            case "arrow":
              s.startX += dx; s.startY += dy;
              s.endX += dx;   s.endY += dy;
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
          }
          else if (this.dragMode === "resize" && this.activeHandle) {
            p.x += this.panOffsetX;
            p.y += this.panOffsetY;

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

            } else if (s.type === "line" || s.type === "arrow") {
              if (this.activeHandle === "start") {
                s.startX = p.x;
                s.startY = p.y;
              } else if (this.activeHandle === "end") {
                s.endX = p.x;
                s.endY = p.y;
              }
            }
          }
          this.clearCanvas();
          if (this.isSolo) {
            this.scheduleLocalSave();
          } else {
            this.safeSend(JSON.stringify({
              type: "shape:add",
              roomName: this.roomId?.toString(),
              shape: s
            }));
            this.scheduleWrite(s);
          }
          return;
        }
if (this.selectedTool === "eraser" && this.clicked) {
  const logicalX = pos.x + this.panOffsetX;
  const logicalY = pos.y + this.panOffsetY;

  // Loop from topmost shape to bottom (reverse order)
  for (let i = this.existingShapes.length - 1; i >= 0; i--) {
    if (this.isPointInsideShape(logicalX, logicalY, this.existingShapes[i])) {
      const shape = this.existingShapes[i];

      // Remove shape immediately on erase hover
      this.deleteShapeByIndex(i);

      // Socket/collaborative sync
      if (!this.isSolo && shape) {
        this.safeSend(
          JSON.stringify({
            type: "shape:delete",
            roomName: this.roomId?.toString(),
            shapeId: shape.id,
          })
        );
        this.scheduleWriteAll();
      } else if (this.isSolo) {
        this.scheduleLocalSave?.();
      }

      this.clearCanvas(); // Redraw after each delete
      break; // Stop at first match (optional, remove break to delete all under eraser)
    }
  }
  return;
}


if (!this.clicked) return;

if (this.selectedTool === "pencil" && this.clicked) {
  // Optionally, prevent duplicate points if mouse didn't move
  const last = this.pencilPoints[this.pencilPoints.length - 1];
  const newX = pos.x + this.panOffsetX;
  const newY = pos.y + this.panOffsetY;
  if (!last || last.x !== newX || last.y !== newY) {
    this.pencilPoints.push({ x: newX, y: newY });
  }

  this.ctx.save();
  this.ctx.strokeStyle = this.currentStrokeColor;
  this.ctx.lineWidth = this.currentStrokeWidth;
  this.ctx.setLineDash(this.getDashArray(this.currentStrokeStyle));
  this.clearCanvas();
  this.drawPencilPath(this.pencilPoints, this.panOffsetX, this.panOffsetY);
  this.ctx.restore();
}

else {
  if (this.startX === null || this.startY === null) return;

  // Compute offsets
  const offsetStartX = this.startX - this.panOffsetX;
  const offsetStartY = this.startY - this.panOffsetY;
  const offsetPosX = pos.x - this.panOffsetX;
  const offsetPosY = pos.y - this.panOffsetY;
  const width = offsetPosX - offsetStartX;
  const height = offsetPosY - offsetStartY;

  // Clear before preview redraw
  this.clearCanvas();

  // Read panel-selected properties
  const strokeCol = this.currentStrokeColor;
  const fillCol = this.currentBackgroundColor;
  const lineWidth = this.currentStrokeWidth;
  const dashArray = this.getDashArray(this.currentStrokeStyle);

  this.ctx.save();
  this.ctx.strokeStyle = strokeCol;
  this.ctx.fillStyle = fillCol;
  this.ctx.lineWidth = lineWidth;
  this.ctx.setLineDash(dashArray);

  // Common geometry calculations for symmetric shapes
  const cx = offsetStartX + width / 2;
  const cy = offsetStartY + height / 2;
  const top = { x: cx, y: cy - height / 2 };
  const right = { x: cx + width / 2, y: cy };
  const bottom = { x: cx, y: cy + height / 2 };
  const left = { x: cx - width / 2, y: cy };

if (this.selectedTool === "rect") {
  const r = Math.min(
    this.MAX_CORNER_RADIUS,
    Math.abs(width) * 0.5,
    Math.abs(height) * 0.5
  );

  // Panel-driven styles
  const strokeCol = this.currentStrokeColor;
  const fillCol = this.currentBackgroundColor;
  const lineWidth = this.currentStrokeWidth;
  const dashArray = this.getDashArray(this.currentStrokeStyle);

  this.ctx.save();
  this.ctx.strokeStyle = strokeCol;
  this.ctx.fillStyle = fillCol;
  this.ctx.lineWidth = lineWidth;
  this.ctx.setLineDash(dashArray);

  this.ctx.beginPath();
  this.ctx.roundRect(offsetStartX, offsetStartY, width, height, r);
  this.ctx.fill();
  this.ctx.stroke();

  this.ctx.restore();
} else if (this.selectedTool === "diamond") {
  this.drawDiamond(
    top,
    right,
    bottom,
    left,
    this.currentStrokeColor,              // stroke color from panel
    this.currentBackgroundColor,          // fill color from panel
    this.getDashArray(this.currentStrokeStyle), // dash array from panel
    this.currentStrokeWidth               // line width from panel
  );
} else if (this.selectedTool === "circle") {
  const rx = Math.abs(width / 2);
  const ry = Math.abs(height / 2);
  this.ctx.save();
  this.ctx.strokeStyle = this.currentStrokeColor;
  this.ctx.fillStyle = this.currentBackgroundColor;
  this.ctx.lineWidth = this.currentStrokeWidth;
  this.ctx.setLineDash(this.getDashArray(this.currentStrokeStyle));
  this.ctx.beginPath();
  this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  this.ctx.fill();    // Apply fill from panel
  this.ctx.stroke();  // Apply stroke from panel
  this.ctx.closePath();
  this.ctx.restore();
}else if (this.selectedTool === "line") {
  this.ctx.save();
  this.ctx.strokeStyle = this.currentStrokeColor;
  this.ctx.lineWidth = this.currentStrokeWidth;
  this.ctx.setLineDash(this.getDashArray(this.currentStrokeStyle));
  this.ctx.beginPath();
  this.ctx.moveTo(offsetStartX, offsetStartY);
  this.ctx.lineTo(offsetPosX, offsetPosY);
  this.ctx.stroke();
  this.ctx.closePath();
  this.ctx.restore();
  this.endX = pos.x;
  this.endY = pos.y;
}
 else if (this.selectedTool === "arrow") {
 this.drawArrow(
  this.ctx,
  this.startX!,
  this.startY!,
  pos.x,
  pos.y,
  this.currentStrokeColor,                  // stroke color
  this.currentBackgroundColor,              // fill color (arrowhead fill)
  this.currentStrokeWidth,                  // line width
  this.getDashArray(this.currentStrokeStyle), // dash array
  this.panOffsetX,
  this.panOffsetY
);
    this.endX = pos.x;
    this.endY = pos.y;
  } else if (this.selectedTool === "text") {
    if (!this.clicked) return;
    this.clearCanvas();
    this.ctx.fillStyle = this.currentStrokeColor;
    this.ctx.font = "16px Arial";
    this.ctx.fillText("Sample Text", offsetPosX, offsetPosY);
  }
}
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  };
}
