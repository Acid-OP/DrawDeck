import { Tool } from "@/components/Canvas";

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
  private roomId?: string | null;
  private roomName?: string | null;
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
    // Solo mode — write to localStorage
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const updated = [...existing, shape];
    localStorage.setItem(key, JSON.stringify(updated));
  }

  this.existingShapes.push(shape);

  // Multiplayer — send to server via socket
  this.safeSend?.({
    type: "shape:add",
    roomId: this.roomId?.toString(),
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
    if (
      mouseX >= pt.x &&
      mouseX <= pt.x + handleSize &&
      mouseY >= pt.y &&
      mouseY <= pt.y + handleSize
    ) {
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
  const w = (x2 - x1) + pad * 2;
  const h = (y2 - y1) + pad * 2;

  const inset = handleSize / 2;

  this.ctx.beginPath();
  this.ctx.moveTo(x + inset, y);            
  this.ctx.lineTo(x + w - inset, y);

  this.ctx.moveTo(x + w, y + inset);        
  this.ctx.lineTo(x + w, y + h - inset);

  this.ctx.moveTo(x + w - inset, y + h);   
  this.ctx.lineTo(x + inset, y + h);

  this.ctx.moveTo(x, y + h - inset);         
  this.ctx.lineTo(x, y + inset);

  this.ctx.stroke();

  
  const handles = [
    { x: x,     y: y },         
    { x: x + w, y: y },         
    { x: x + w, y: y + h },     
    { x: x,     y: y + h },     
  ];

  for (const { x: hx, y: hy } of handles) {
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

  const inset = handleSize / 2;

  this.ctx.beginPath();
  this.ctx.moveTo(x + inset, y);         
  this.ctx.lineTo(x + w - inset, y);

  this.ctx.moveTo(x + w, y + inset);         
  this.ctx.lineTo(x + w, y + h - inset);

  this.ctx.moveTo(x + w - inset, y + h);     
  this.ctx.lineTo(x + inset, y + h);

  this.ctx.moveTo(x, y + h - inset);       
  this.ctx.lineTo(x, y + inset);
  this.ctx.stroke();

  const handles = [
    { x: x,     y: y },
    { x: x + w, y: y },
    { x: x + w, y: y + h },
    { x: x,     y: y + h },
  ];
  for (const { x: hx, y: hy } of handles) {
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

  const inset = handleSize / 2;

  this.ctx.beginPath();
  this.ctx.moveTo(minX + inset, minY);            
  this.ctx.lineTo(maxX - inset, minY);

  this.ctx.moveTo(maxX, minY + inset);             
  this.ctx.lineTo(maxX, maxY - inset);

  this.ctx.moveTo(maxX - inset, maxY);             
  this.ctx.lineTo(minX + inset, maxY);

  this.ctx.moveTo(minX, maxY - inset);             
  this.ctx.lineTo(minX, minY + inset);
  this.ctx.stroke();

  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
  for (const { x: hx, y: hy } of corners) {
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

  const inset = handleSize / 2;

  this.ctx.beginPath();
  this.ctx.moveTo(x + inset, y);          
  this.ctx.lineTo(x + w - inset, y);

  this.ctx.moveTo(x + w, y + inset);     
  this.ctx.lineTo(x + w, y + h - inset);

  this.ctx.moveTo(x + w - inset, y + h);  
  this.ctx.lineTo(x + inset, y + h);

  this.ctx.moveTo(x, y + h - inset);       
  this.ctx.lineTo(x, y + inset);
  this.ctx.stroke();

  const corners = [
    { x: x,     y: y },
    { x: x + w, y: y },
    { x: x + w, y: y + h },
    { x: x,     y: y + h },
  ];
  for (const { x: hx, y: hy } of corners) {
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

  const inset = handleSize / 2;

  this.ctx.beginPath();
  this.ctx.moveTo(minX + inset, minY);          
  this.ctx.lineTo(maxX - inset, minY);

  this.ctx.moveTo(maxX, minY + inset);           
  this.ctx.lineTo(maxX, maxY - inset);

  this.ctx.moveTo(maxX - inset, maxY);         
  this.ctx.lineTo(minX + inset, maxY);

  this.ctx.moveTo(minX, maxY - inset);           
  this.ctx.lineTo(minX, minY + inset);
  this.ctx.stroke();

  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
  for (const { x: hx, y: hy } of corners) {
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
      console.log("[Game.constructor] roomName:", roomName);
  console.log("[Game.constructor] parsed roomId:", this.roomId);

    this.socket = socket;
    this.theme = theme;
    this.clearCanvas();
    this.clicked = false;
    this.init();
    if (!isSolo && this.socket) this.initHandlers();
    this.initMouseHandlers();
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

    if (shape.type === "rect") {
      const x1 = Math.min(shape.x, shape.x + shape.width);
      const y1 = Math.min(shape.y, shape.y + shape.height);
      const x2 = Math.max(shape.x, shape.x + shape.width);
      const y2 = Math.max(shape.y, shape.y + shape.height);
      boxX = x1 - pad;
      boxY = y1 - pad;
      boxW = (x2 - x1) + pad * 2;
      boxH = (y2 - y1) + pad * 2;
    }else if (shape.type === "circle") {
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
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };
private isPointInsideShape(x: number, y: number, shape: Shape): boolean {
  const pad = 6;

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
) {
  this.ctx.strokeStyle = strokeStyle;

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

  this.initHandlers();

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
    if (msg.roomId !== this.roomId?.toString()) return;

    switch (msg.type) {
      case "shape:add": {
        const shape = msg.shape;
        const exists = this.existingShapes.some(s => s.id === shape.id);
        if (!exists) {
          this.existingShapes.push(shape);
          this.scheduleWrite(shape);
          this.broadcastShape(shape);
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
      }}
    };
  }
deleteShapeById(id: string) {
  this.existingShapes = this.existingShapes.filter(shape => shape.id !== id);
  this.saveToLocalStorage();
}

private deleteShapeByIndex(index: number) {
  const shape = this.existingShapes[index];
  if (!shape) return;
  this.existingShapes.splice(index, 1);

  if (this.isSolo) {
  this.scheduleLocalSave();
} else {
  this.scheduleWriteAll();
  this.safeSend({
    type: "shape:delete",
    roomId: this.roomId?.toString(),
    shapeId: shape.id,
  });
}


  this.clearCanvas();
}


  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
     this.ctx.fillStyle = this.theme === "dark" ? "#121212" : "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.existingShapes.forEach((shape , idx) => {
      const isHovered = this.selectedTool === "eraser" &&
      this.hoveredForErase?.includes(idx);
     const strokeCol = isHovered ? "rgba(255,80,80)" : (this.theme === 'dark' ? "#ffffff" : "#000000");
     const fillCol = strokeCol;
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
        this.ctx.fillStyle = fillCol;
        this.drawDiamond(shape.top, shape.right, shape.bottom, shape.left,strokeCol);
      } else if (shape.type === "circle") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.fillStyle = fillCol;
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
        this.ctx.fillStyle = fillCol;
        this.drawPencilPath(shape.points);
      } else if (shape.type === "line" || shape.type === "arrow") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.fillStyle = fillCol;
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        this.ctx.closePath();
        if (shape.type === "arrow") {
          this.drawArrow(this.ctx, shape.startX, shape.startY, shape.endX, shape.endY, strokeCol);
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
    this.ctx.stroke();
    this.ctx.closePath();
  }

  mouseDownHandler = (e: MouseEvent) => {
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
          this.clearCanvas();
          return;
        }
      }
      this.selectedShapeIndex = null;
      this.clearCanvas();
      return;
    }
if (this.selectedTool === "eraser") {
  console.log("Eraser mouse up triggered");
  this.clicked = true;
  this.hoveredForErase = [];

  const hitIndexes: number[] = [];
  for (let i = 0; i < this.existingShapes.length; i++) {
    if (this.isPointInsideShape(pos.x, pos.y, this.existingShapes[i])) {
      hitIndexes.push(i);
    }
  }

  this.hoveredForErase = hitIndexes;
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
    endY: number,
    strokeStyle: string
  ) {
    ctx.strokeStyle = strokeStyle;
    ctx.fillStyle = strokeStyle;
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
private scheduleWriteAll() {
  if (!this.roomId) return;
  const key = `shapes_${this.roomId}`;
  localStorage.setItem(key, JSON.stringify(this.existingShapes));
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
        if (this.isSolo) {
          this.scheduleLocalSave(); // Save locally
        } else {
          this.safeSend(
            JSON.stringify({
              type: "shape:add",
              roomId: this.roomId?.toString(),
              shape,
            })
          );
        }
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
      this.broadcastShape(shape);
      this.scheduleLocalSave();

      this.selectedShapeIndex = this.existingShapes.length - 1;

      if (this.onToolChange) this.onToolChange("select");
      this.selectedTool = "select";

      this.clearCanvas();
      return;
    }
    if (this.selectedTool === "eraser") {
    if (!this.hoveredForErase || this.hoveredForErase.length === 0) return;
    console.log(" Inside eraser logic, isSolo?", this.isSolo);
    const doomedIds = this.hoveredForErase.map(i => this.existingShapes[i]?.id).filter(Boolean);
    this.hoveredForErase.sort((a, b) => b - a).forEach(i => {
  this.deleteShapeByIndex(i);
});

    this.hoveredForErase = [];
    this.clearCanvas();

    if (this.isSolo) {
    
      return;
    }

  // 🎯 Collaborative mode
    doomedIds.forEach(id => {
      this.safeSend(
        JSON.stringify({
          type: "shape:delete",
          roomId: this.roomId?.toString(),
          shapeId: id,
        })
      );
    });
    this.scheduleWriteAll();

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
if (!this.isSolo) {
  this.broadcastShape(shape);
}
this.scheduleLocalSave();



      this.startX = null;
      this.startY = null;
      this.endX = null;
      this.endY = null;
      this.pencilPoints = [];
    };

  mouseMoveHandler = (e: MouseEvent) => {
    const pos = this.getMousePos(e);
    const strokeCol = this.theme === "dark" ? "#ffffff" : "#000000";
    if (this.selectedTool === "select" && this.selectedShapeIndex != null) {
      const shape = this.existingShapes[this.selectedShapeIndex];
      if (!shape) return;
    if (shape.type === "line" || shape.type === "arrow") {
      const dist = (x1: number, y1: number, x2: number, y2: number) =>
      Math.hypot(x2 - x1, y2 - y1);
      const handleRadius = 8;
      const { startX: x1, startY: y1, endX: x2, endY: y2 } = shape;
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
      const h = this.hitTestShapeHandle(shape, pos.x, pos.y);
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
      }
       else if (this.isPointInsideShape(pos.x, pos.y, shape)) {
          this.canvas.style.cursor = "move";
        } else {
          this.canvas.style.cursor = "default";
        }
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
this.clearCanvas();

if (this.isSolo) {
  this.scheduleLocalSave();
} else {
  this.safeSend(JSON.stringify({
    type: "shape:add",
    roomId: this.roomId?.toString(),
    shape: s
  }));
  this.scheduleWrite(s);
}

        return;
      }
      if (this.selectedTool === "eraser") {
        if (!this.clicked) return;
        for (let i = 0; i < this.existingShapes.length; i++) {
          if (this.isPointInsideShape(pos.x, pos.y, this.existingShapes[i]) && !this.hoveredForErase.includes(i)) {
            this.hoveredForErase.push(i);
          }
          console.log("Hovered for erase:", this.hoveredForErase);
        }
        this.ctx.strokeStyle = strokeCol;
        this.clearCanvas(); 
        return;
      }
      if (!this.clicked) return;
      if (this.selectedTool === "pencil") {
        this.pencilPoints.push(pos);
        this.ctx.strokeStyle = strokeCol;
        this.clearCanvas();
        this.drawPencilPath(this.pencilPoints);
      } else {
        if (this.startX === null || this.startY === null) return;
        const width = pos.x - this.startX;
        const height = pos.y - this.startY;
        this.clearCanvas();
        this.ctx.strokeStyle = strokeCol; 
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
          this.drawDiamond(top, right, bottom, left,strokeCol);
        } else if (this.selectedTool === "circle") {
          const rx = Math.abs((pos.x - this.startX) / 2);
          const ry = Math.abs((pos.y - this.startY) / 2);
          const cx = this.startX + (pos.x - this.startX) / 2;
          const cy = this.startY + (pos.y - this.startY) / 2;
          this.ctx.beginPath();
          this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          this.ctx.strokeStyle = strokeCol;
          this.ctx.stroke();
          this.ctx.closePath();
      } else if (this.selectedTool === "line") {
          this.ctx.beginPath();
          this.ctx.moveTo(this.startX, this.startY);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.strokeStyle = strokeCol;
          this.ctx.stroke();
          this.ctx.closePath();
          this.endX = pos.x;
          this.endY = pos.y;
      } else if (this.selectedTool === "arrow") {
          this.clearCanvas(); 
          this.drawArrow(this.ctx, this.startX, this.startY, pos.x, pos.y, strokeCol);
          this.endX = pos.x;
          this.endY = pos.y;
      } else if (this.selectedTool === "text") {
        if (!this.clicked) return;
          this.clearCanvas();
        this.ctx.fillStyle = strokeCol;
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
