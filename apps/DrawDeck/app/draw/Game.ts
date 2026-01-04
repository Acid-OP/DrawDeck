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
      fontSize?: number;
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
  private roomId: string;
  private clicked: boolean;
  private startX: number | null = null;
  private startY: number | null = null;
  private endX: number | null = null;
  private endY: number | null = null;
  private selectedTool: Tool = "circle";
  public panOffsetX = 0;
  private isNewlyCreated: boolean = false;
  public panOffsetY = 0;
  private isPanning = false;
  private lastPanX = 0;
   private dragStartPos: { x: number; y: number } | null = null;
  private hasDragged = false;
  private readonly MIN_DRAG_DISTANCE = 5;
  private lastPanY = 0;
  private isLocalUpdate = false;
  private pencilPoints: { x: number; y: number }[] = [];
  public onTextInsert?: (x: number, y: number) => void;
  public onToolChange?: (tool: Tool) => void;
  private selectedShapeIndex: number | null = null;
  private hoveredForErase: number[] = [];
  socket?: WebSocket | null;
  encryptionKey? : string | null;
  private dragMode: "none" | "move" | "resize" = "none";
  private activeHandle: "tl" | "tr" | "bl" | "br" | "start" | "end" | null = null;
  private offsetX = 0;
  private offsetY = 0;
  public zoom: number = 1;
  private readonly MAX_CORNER_RADIUS = 10;
  private isSolo: boolean;
  private sendMessage?: (message: any, priority?: number) => boolean;
  public currentStrokeColor: string = '#1e1e1e';    
  public currentBackgroundColor: string = 'transparent';
  public currentStrokeWidth: number = 2;
  public currentStrokeStyle: number = 0;
  public currentFillStyle: number = 0;
  private hoveredEndpoint: "start" | "end" | "mid" | null = null;
  
  // Undo/Redo history
  private history: Shape[][] = [];
  private historyIndex: number = -1;
  private readonly MAX_HISTORY = 50;
  private isUndoRedoAction: boolean = false;
  
  // Clipboard for copy/paste
  private clipboard: Shape | null = null;
  private genId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      try {
        return crypto.randomUUID();
      } catch (e) {
        console.warn('crypto.randomUUID failed, falling back to manual generation');
      }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }); 
  }
public setTheme(theme: "light" | "dark") {
  this.theme = theme;
  try {
    localStorage.setItem("canvas_theme", theme);
  } catch (err) {
    console.error("Failed to save theme to localStorage", err);
  }
  
  this.clearCanvas(); 
}

  public hasShapes(): boolean {
    return this.existingShapes.length > 0;
  }

  // History management for undo/redo
  private saveToHistory() {
    if (this.isUndoRedoAction) return;
    
    // Create a deep copy of current shapes
    const snapshot = JSON.parse(JSON.stringify(this.existingShapes));
    
    // Remove any states after current index (when user makes new action after undo)
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add new state
    this.history.push(snapshot);
    
    // Limit history size
    if (this.history.length > this.MAX_HISTORY) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  public undo() {
    if (this.historyIndex <= 0) {
      console.log('Nothing to undo');
      return;
    }
    
    this.isUndoRedoAction = true;
    this.historyIndex--;
    this.existingShapes = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    this.saveToLocalStorage();
    this.clearCanvas();
    this.isUndoRedoAction = false;
  }

  public redo() {
    if (this.historyIndex >= this.history.length - 1) {
      console.log('Nothing to redo');
      return;
    }
    
    this.isUndoRedoAction = true;
    this.historyIndex++;
    this.existingShapes = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
    this.saveToLocalStorage();
    this.clearCanvas();
    this.isUndoRedoAction = false;
  }

  public canUndo(): boolean {
    return this.historyIndex > 0;
  }

  public canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // Copy/Paste/Duplicate functionality
  public copySelected() {
    if (this.selectedShapeIndex === null) {
      console.log('No shape selected to copy');
      return;
    }
    
    const shape = this.existingShapes[this.selectedShapeIndex];
    if (shape) {
      // Deep clone the shape
      this.clipboard = JSON.parse(JSON.stringify(shape));
      console.log('Shape copied to clipboard');
    }
  }

  public pasteFromClipboard() {
    if (!this.clipboard) {
      console.log('Nothing to paste');
      return;
    }
    
    // Create a new shape from clipboard with new ID and offset position
    const newShape = JSON.parse(JSON.stringify(this.clipboard));
    newShape.id = this.genId();
    
    // Offset the pasted shape by 20px so it's visible
    const offset = 20 / this.zoom;
    
    if (newShape.type === 'rect') {
      newShape.x += offset;
      newShape.y += offset;
    } else if (newShape.type === 'circle') {
      newShape.centerX += offset;
      newShape.centerY += offset;
    } else if (newShape.type === 'diamond') {
      newShape.top.x += offset;
      newShape.top.y += offset;
      newShape.right.x += offset;
      newShape.right.y += offset;
      newShape.bottom.x += offset;
      newShape.bottom.y += offset;
      newShape.left.x += offset;
      newShape.left.y += offset;
    } else if (newShape.type === 'line' || newShape.type === 'arrow') {
      newShape.startX += offset;
      newShape.startY += offset;
      newShape.endX += offset;
      newShape.endY += offset;
    } else if (newShape.type === 'pencil') {
      newShape.points = newShape.points.map((p: { x: number; y: number }) => ({
        x: p.x + offset,
        y: p.y + offset
      }));
    } else if (newShape.type === 'text') {
      newShape.x += offset;
      newShape.y += offset;
    }
    
    // Add the new shape
    this.existingShapes.push(newShape);
    this.saveToHistory();
    this.selectedShapeIndex = this.existingShapes.length - 1;
    
    // Broadcast if not solo
    if (!this.isSolo) {
      this.safeSend({
        type: "shape_add",
        roomId: this.roomId?.toString(),
        shape: newShape,
      }, 2);
    }
    
    this.scheduleLocalSave();
    this.clearCanvas();
    console.log('Shape pasted');
  }

  public duplicateSelected() {
    if (this.selectedShapeIndex === null) {
      console.log('No shape selected to duplicate');
      return;
    }
    
    // Copy then paste
    this.copySelected();
    this.pasteFromClipboard();
  }

  public deleteSelected() {
    if (this.selectedShapeIndex === null) {
      console.log('No shape selected to delete');
      return;
    }
    
    const shape = this.existingShapes[this.selectedShapeIndex];
    if (!shape) return;
    
    // Delete the shape
    this.deleteShapeByIndex(this.selectedShapeIndex);
    
    // Broadcast delete if not solo
    if (!this.isSolo) {
      this.safeSend({
        type: "shape_delete",
        roomId: this.roomId?.toString(),
        shapeId: shape.id,
      }, 2);
    }
    
    // Deselect
    this.selectedShapeIndex = null;
    this.clearCanvas();
    console.log('Shape deleted');
  }
  public zoomIn() {
  this.zoom = Math.min(this.zoom + 0.1, 5); 
  this.clearCanvas();
  }

  public zoomOut() {
    this.zoom = Math.max(this.zoom - 0.1, 0.2); 
    this.clearCanvas();
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

private safeSend(payload: any, priority: number = 1) {
  if (this.isSolo || !this.socket || this.socket.readyState !== WebSocket.OPEN || !this.roomId) return;
  
  try {
    // Use the passed sendMessage if available (with rate limiting)
    if (this.sendMessage) {
      const sent = this.sendMessage(payload, priority);
      if (!sent) {
        console.warn('⚠️ [CLIENT] Message rate limited, queued:', payload.type);
      }
      return sent;
    } else {
      // Fallback to direct send (no rate limiting)
      this.socket.send(JSON.stringify(payload));
      return true;
    }
  } catch (error) {
    console.error('❌ [CLIENT] WS send failed:', error);
    return false;
  }
}

private broadcastShape(shape: Shape) {
  if (this.isSolo) {
    this.existingShapes.push(shape);
    this.saveToHistory(); // Save state for undo/redo
    this.scheduleLocalSave();
    return;
  }
  
  this.saveToHistory(); // Save state for undo/redo
  this.scheduleWriteAll();
  
  // Use priority 2 for shape creation (important but not critical)
  this.safeSend({
    type: "shape_add",
    roomId: this.roomId?.toString(),
    shape: shape,
    encryptionKey: this.encryptionKey
  }, 2);
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
      const fontSize = shape.fontSize || 20;
      const lines = shape.text.split('\n');
      const lineHeight = fontSize * 1.2;
  
      this.ctx.font = `${fontSize}px Virgil`;
      let maxWidth = 0;
      lines.forEach(line => {
        const metrics = this.ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      });
  
      const totalHeight = lines.length * lineHeight;
  
      x = shape.x;
      y = shape.y;
      width = maxWidth;
      height = totalHeight;
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
      ctx.strokeStyle = "rgba(98, 80, 223, 0.4)"; 
      ctx.lineWidth = 6;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);

    if (isMid) {
      ctx.fillStyle = "#6250df"; 
      ctx.fill();
    } else {
      ctx.fillStyle = "transparent"; 
    }

    ctx.strokeStyle = "#6250df"; 
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  
private drawLineHandles(
  shape: Extract<Shape, { type: "line" | "arrow" }>
) {
  const { startX, startY, endX, endY } = shape;
  const r = 4;
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.hypot(dx, dy);
  if (len === 0) return;

  const ux = dx / len, uy = dy / len;
  const startCx = startX - ux * r;
  const startCy = startY - uy * r;
  const endCx   = endX   + ux * r;
  const endCy   = endY   + uy * r;
  const midCx   = (startX + endX) / 2;
  const midCy   = (startY + endY) / 2;

  this.drawCircleHandle(startCx, startCy, false, r, this.hoveredEndpoint === "start");
  this.drawCircleHandle(endCx, endCy, false, r, this.hoveredEndpoint === "end");
  this.drawCircleHandle(midCx, midCy, true, r, this.hoveredEndpoint === "mid");
}

  // ─── Line Connecting Selection Box to Handle 
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


private drawSelectionBox(shape: Shape) {
    this.ctx.save();
    this.ctx.strokeStyle = "#9b7bff"; 
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([]);

    const pad = 8;
    const handleSize = 10;
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
    this.drawHandleBox(hx , hy );
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

  this.ctx.moveTo(x + w , y + inset );           
  this.ctx.lineTo(x + w , y + h - inset );

  this.ctx.moveTo(x + w - inset, y + h);          
  this.ctx.lineTo(x + inset, y + h);

  this.ctx.moveTo(x, y + h - inset);             
  this.ctx.lineTo(x , y + inset );
  this.ctx.stroke();

  const handles = [
    { x: x,     y: y },
    { x: x + w, y: y },
    { x: x + w, y: y + h },
    { x: x,     y: y + h },
  ];
  for (const { x: hx, y: hy } of handles) {
    this.drawHandleBox(hx , hy );
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
  this.ctx.moveTo(minX + inset, minY );           
  this.ctx.lineTo(maxX - inset, minY );

  this.ctx.moveTo(maxX, minY + inset );           
  this.ctx.lineTo(maxX, maxY - inset );

  this.ctx.moveTo(maxX - inset, maxY );           
  this.ctx.lineTo(minX + inset, maxY);

  this.ctx.moveTo(minX, maxY - inset );           
  this.ctx.lineTo(minX, minY + inset );

  this.ctx.stroke();

  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
  for (const { x: hx, y: hy } of corners) {
    this.drawHandleBox(hx , hy );
  }

  this.ctx.restore();
  return;
}
if (shape.type === "text") {
  const fontSize = shape.fontSize || 20;
  const lines = shape.text.split('\n');
  const lineHeight = fontSize * 1.2;
  
  // Calculate dimensions for all lines
  this.ctx.font = `${fontSize}px Virgil`;
  let maxWidth = 0;
  lines.forEach(line => {
    const metrics = this.ctx.measureText(line);
    maxWidth = Math.max(maxWidth, metrics.width);
  });
  
  const totalHeight = lines.length * lineHeight;
  
  const x = shape.x - pad / 2;
  const y = shape.y - pad / 2;
  const w = maxWidth + pad;
  const h = totalHeight + pad;

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
  
  // Right line  
  this.ctx.moveTo(maxX, minY + inset);
  this.ctx.lineTo(maxX, maxY - inset);
  
  // Bottom line
  this.ctx.moveTo(maxX - inset, maxY);
  this.ctx.lineTo(minX + inset, maxY);
  
  // Left line
  this.ctx.moveTo(minX, maxY - inset);
  this.ctx.lineTo(minX, minY + inset);
  
  this.ctx.stroke();

  // Draw selection handles at corners
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
// Add to Game class
initTouchHandlers() {
  if (!this.canvas) return;
  this.canvas.addEventListener("touchstart", this.touchStartHandler, { passive: false });
  this.canvas.addEventListener("touchend", this.touchEndHandler, { passive: false });
  this.canvas.addEventListener("touchmove", this.touchMoveHandler, { passive: false });
}

private getTouchPos = (e: TouchEvent): { x: number; y: number } => {
  const rect = this.canvas.getBoundingClientRect();
  const touch = e.touches[0] || e.changedTouches[0];
  
  // Convert screen coordinates to logical coordinates
  const screenX = touch.clientX - rect.left;
  const screenY = touch.clientY - rect.top;
  
  // Transform screen coordinates to logical coordinates accounting for pan and zoom
  const logicalX = (screenX - this.panOffsetX) / this.zoom;
  const logicalY = (screenY - this.panOffsetY) / this.zoom;
  
  return {
    x: logicalX,
    y: logicalY,
  };
};
touchStartHandler = (e: TouchEvent) => {
  e.preventDefault();
  const touch = e.touches[0];
  const mockEvent = {
    clientX: touch.clientX,
    clientY: touch.clientY,
    preventDefault: () => e.preventDefault()
  } as MouseEvent;
  
  this.mouseDownHandler(mockEvent);
};

touchEndHandler = (e: TouchEvent) => {
  e.preventDefault();
  const touch = e.changedTouches[0];
  const mockEvent = {
    clientX: touch.clientX,
    clientY: touch.clientY,
    preventDefault: () => e.preventDefault()
  } as MouseEvent;
  
  this.mouseUpHandler(mockEvent);
};

touchMoveHandler = (e: TouchEvent) => {
  e.preventDefault();
  const touch = e.touches[0];
  const mockEvent = {
    clientX: touch.clientX,
    clientY: touch.clientY,
    preventDefault: () => e.preventDefault()
  } as MouseEvent;
  
  this.mouseMoveHandler(mockEvent);
};

// Add this method to force a complete redraw
private forceRedraw() {
  // Clear the entire canvas
  this.ctx.save();
  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.restore();
  
  // Redraw everything
  this.clearCanvas();
}
  constructor(canvas: HTMLCanvasElement, roomId: string | null, socket: WebSocket | null , isSolo:boolean=false , theme: "light" | "dark" , encryptionKey: string | null = null , sendMessage?: (message: any, priority?: number) => boolean) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingShapes = [];
    this.isSolo = isSolo;
    if (!roomId) throw new Error("roomId is required");
    this.roomId = roomId;
    this.socket = socket;
    this.theme = theme;
    this.initTouchHandlers();
    this.clearCanvas();
    this.encryptionKey = encryptionKey;
    this.panOffsetX = 0;
    this.sendMessage = sendMessage;
    this.panOffsetY = 0;
    this.loadPanOffset();
    this.clicked = false;
    
    // Initialize undo/redo history with empty state
    this.history = [[]];
    this.historyIndex = 0;
    
    this.init();
    if (!this.isSolo && this.socket) {
    this.initHandlers(); 
    }
    this.initMouseHandlers();
    window.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.ctrlKey || e.metaKey) {
    // Zoom In: Ctrl + '=' or Ctrl + '+'
    if (e.key === "=" || e.key === "+" || e.code === "Equal") {
      e.preventDefault();
      this.zoom = Math.min(this.zoom + 0.1, 5);
      this.clearCanvas();
    }
    // Zoom Out: Ctrl + '-'
    if (e.key === "-" || e.code === "Minus") {
      e.preventDefault();
      this.zoom = Math.max(this.zoom - 0.1, 0.2);
      this.clearCanvas();
    }
  }
});

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
  const metrics = this.ctx.measureText(shape.text);
  const width = metrics.width;
  const height = 20;
  boxX = shape.x - pad / 2;
  boxY = shape.y - pad / 2; // y is top of text
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
private drawMultilineText(text: string, x: number, y: number, fontSize: number, fillStyle: string) {
  const lines = text.split('\n');
  const lineHeight = fontSize * 1.2; 
  
  this.ctx.font = `${fontSize}px Virgil`;
  this.ctx.textBaseline = "top";
  this.ctx.fillStyle = fillStyle;
  
  lines.forEach((line, index) => {
    this.ctx.fillText(line, x, y + (index * lineHeight));
  });
}


addTextShape(x: number, y: number, text: string) {
  const shape = {
    id: this.genId(),
    type: "text" as const,
    x,
    y,
    text,
    fontSize: 20, 
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
  this.selectedShapeIndex = this.existingShapes.length - 1;
   this.isNewlyCreated = true;
   setTimeout(() => {
    this.isNewlyCreated = false;
  }, 100);

  // this.selectedTool = "select";
  // if (this.onToolChange) this.onToolChange("select");
  
  setTimeout(() => {
    this.clearCanvas();
    this.ctx.font = `20px Virgil`;
  }, 10);
}

getMousePos = (e: MouseEvent) => {
  const rect = this.canvas.getBoundingClientRect();
  // Convert screen coordinates to logical coordinates
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  
  // Transform screen coordinates to logical coordinates accounting for pan and zoom
  const logicalX = (screenX - this.panOffsetX) / this.zoom;
  const logicalY = (screenY - this.panOffsetY) / this.zoom;
  
  return {
    x: logicalX,
    y: logicalY,
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
    }if (shape.type === "text") {
      const fontSize = shape.fontSize || 20;
      const lines = shape.text.split('\n');
      const lineHeight = fontSize * 1.2;
  
  // Calculate total height based on number of lines
      const totalHeight = lines.length * lineHeight;
  
  // Calculate max width of all lines
      this.ctx.font = `${fontSize}px Virgil`;
      let maxWidth = 0;
      lines.forEach(line => {
        const metrics = this.ctx.measureText(line);
        maxWidth = Math.max(maxWidth, metrics.width);
      });
      const pad = 6;
      return (
        x >= shape.x - pad &&
        x <= shape.x + maxWidth + pad &&
        y >= shape.y - pad &&
        y <= shape.y + totalHeight + pad
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
  this.ctx.save();
  this.ctx.strokeStyle = strokeStyle;
  this.ctx.fillStyle = fillStyle;
  this.ctx.setLineDash(dashPattern);
  this.ctx.lineWidth = lineWidth;

  this.ctx.beginPath();
  this.ctx.moveTo(top.x, top.y);
  this.ctx.lineTo(right.x, right.y);
  this.ctx.lineTo(bottom.x, bottom.y);
  this.ctx.lineTo(left.x, left.y);
  this.ctx.closePath();
  this.ctx.fill();
  this.ctx.stroke();
  this.ctx.restore();
}

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);

      this.canvas.removeEventListener("touchstart", this.touchStartHandler);
  this.canvas.removeEventListener("touchend", this.touchEndHandler);
  this.canvas.removeEventListener("touchmove", this.touchMoveHandler);

  }

setTool(tool: Tool) {
  this.selectedTool = tool;
  this.hoveredForErase = [];

  // ✅ ADD: Cursor management for hand tool
  if (tool === "hand") {
    this.canvas.style.cursor = "grab";
  } else if (tool === "select") {
    this.canvas.style.cursor = "default";
  } else {
    this.canvas.style.cursor = "crosshair";
  }

  if (tool !== "select") {
    this.deselectShape();
  }
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
      const adaptedShape = this.adaptShapeToTheme(shape);
      this.existingShapes.push(adaptedShape);
    }
  });

  this.clearCanvas();
}
public clearAllShapes() {
  if (this.isSolo) {
    this.existingShapes = [];
    this.saveToHistory(); // Save state for undo/redo
    const key = this.getLocalStorageKey(); 
    localStorage.removeItem(key); 
    this.clearCanvas();
  }
}
public toggleDefaultStrokeColors(theme: "light" | "dark") {
  const defaultBlack = '#1e1e1e';
  const defaultWhite = '#ffffff';
  this.existingShapes = this.existingShapes.map(shape => {
    const sc = shape.strokeColor.toLowerCase();
    if (sc === defaultBlack.toLowerCase()) {
      return { ...shape, strokeColor: theme === "dark" ? defaultWhite : defaultBlack };
    } else if (sc === defaultWhite.toLowerCase()) {
      return { ...shape, strokeColor: theme === "light" ? defaultBlack : defaultWhite };
    }
    return shape;
  });
  try {
    const key = this.getLocalStorageKey();
    localStorage.setItem(key, JSON.stringify(this.existingShapes));
  } catch (err) {
    console.error("Failed to save updated shapes to localStorage", err);
  }
  this.clearCanvas();
}
private getShapePosition(shape: Shape): string {
  switch (shape.type) {
    case "rect": return `(${shape.x}, ${shape.y})`;
    case "circle": return `(${shape.centerX}, ${shape.centerY})`;
    case "line":
    case "arrow": return `(${shape.startX}, ${shape.startY}) -> (${shape.endX}, ${shape.endY})`;
    case "text": return `(${shape.x}, ${shape.y})`;
    case "diamond": return `center: (${(shape.left.x + shape.right.x)/2}, ${(shape.top.y + shape.bottom.y)/2})`;
    case "pencil": return shape.points.length > 0 ? `start: (${shape.points[0].x}, ${shape.points[0].y})` : "empty";
    default: return "unknown";
  }
}

// Add duplicate detection method:
private checkForDuplicates() {
  const ids = this.existingShapes.map(s => s.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    console.error("🚨 DUPLICATE SHAPES DETECTED:", duplicates);
  }
}

initHandlers() {
  if (this.isSolo || !this.socket || !this.roomId) return;

  this.socket.onmessage = (event) => {
    let msg = JSON.parse(event.data);;
    switch (msg.type) {
      case "shape_add": {
        const shape = msg.shape;
        
        // Check if we already have this shape
        const existingIndex = this.existingShapes.findIndex(s => s.id === shape.id);
        
        if (existingIndex !== -1) {
          return; // duplicates
        }
        const adaptedShape = this.adaptShapeToTheme(shape);
        this.existingShapes.push(adaptedShape);
        this.scheduleWriteAll();
        if (!this.isNewlyCreated) {
          this.clearCanvas();
        }
        break;
      }
      
      case "shape_update": {
        const updatedShape = msg.shape;
        const existingIndex = this.existingShapes.findIndex(s => s.id === updatedShape.id);
  
        if (existingIndex === -1) {
          return;
        }
        const adaptedShape = this.adaptShapeToTheme(updatedShape);
        this.existingShapes[existingIndex] = adaptedShape;
  
        this.scheduleWriteAll();
        this.clearCanvas();
        break;
      }
      
      case "shape_delete": {
        const shapeId = msg.shapeId;
        const existingIndex = this.existingShapes.findIndex(s => s.id === shapeId);
        
        if (existingIndex !== -1) {
          this.existingShapes.splice(existingIndex, 1);
          
          if (this.selectedShapeIndex === existingIndex) {
            this.selectedShapeIndex = null;
          } else if (this.selectedShapeIndex !== null && this.selectedShapeIndex > existingIndex) {
            this.selectedShapeIndex--;
          }
          
          this.scheduleWriteAll();
          this.clearCanvas();
        }
        break;
      }
    }
  };
}

private broadcastShapeUpdate(shape: Shape) {
  if (this.isSolo) {
    this.scheduleLocalSave();
    return;
  }
  
  const localIndex = this.existingShapes.findIndex(s => s.id === shape.id);
  if (localIndex === -1) {
    console.error('❌ Attempted to update non-existent shape:', shape.id);
    return;
  }
  
  this.scheduleWriteAll();
  
  // Use priority 1 for shape updates (normal priority, can be queued)
  this.safeSend({
    type: "shape_update",
    roomId: this.roomId?.toString(),
    shape: shape,
    encryptionKey: this.encryptionKey
  }, 1);
}


deleteShapeById(id: string) {
  this.existingShapes = this.existingShapes.filter(shape => shape.id !== id);
  this.saveToLocalStorage();
}

public deleteShapeByIndex(index: number) {
  const shape = this.existingShapes[index];
  if (!shape) return;
  
  this.existingShapes.splice(index, 1);
  this.saveToHistory(); // Save state for undo/redo

  if (this.isSolo) {
    this.scheduleLocalSave();
  } else {
    this.scheduleWriteAll();
    
    // Use priority 2 for deletions (important)
    this.safeSend({
      type: "shape_delete",
      roomId: this.roomId?.toString(),
      shapeId: shape.id,
      encryptionKey: this.encryptionKey
    }, 2);
  }

  this.clearCanvas();
}

  getDashArray(style: number | string): number[] {
    if (style === 1 || style === "dashed") return [8, 6];
    if (style === 2 || style === "dotted") return [2, 6];
    return [];
  }
  private adaptShapeToTheme(shape: Shape): Shape {
    const lightDefault = '#1e1e1e';
    const darkDefault = '#ffffff';
    const isDefaultColor = shape.strokeColor.toLowerCase() === lightDefault.toLowerCase() ||  shape.strokeColor.toLowerCase() === darkDefault.toLowerCase();
  
    if (isDefaultColor) {
      const newStrokeColor = this.theme === "dark" ? darkDefault : lightDefault;
      return { ...shape, strokeColor: newStrokeColor };
    }
  
    return shape; 
  }
  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = this.theme === "dark" ? "#121212" : "#ffffff";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    function getDashArray(style: number | string): number[] {
      if (style === 1 || style === "dashed") return [8, 6];
      if (style === 2 || style === "dotted") return [2, 6];
      return [];
    }
    this.ctx.save();                          
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);     
    this.ctx.translate(this.panOffsetX, this.panOffsetY); 
    this.ctx.scale(this.zoom, this.zoom);         
    this.existingShapes.forEach((shape , idx) => {
      const isHovered = this.selectedTool === "eraser" &&
      this.hoveredForErase?.includes(idx); 
      const strokeCol = isHovered 
      ? "rgba(255,80,80)" 
      : (shape as any).strokeColor ?? (this.theme === 'dark' ? "#ffffff" : "#000000");
      const fillCol = (shape as any).backgroundColor ?? "transparent";
      const lineWidth = (shape as any).strokeWidth ?? 2;
      const dashArray = getDashArray((shape as any).strokeStyle);
      this.ctx.save();
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
        shape.x ,
        shape.y ,
        shape.width,
        shape.height,
        r
      );
      this.ctx.fill();
      this.ctx.stroke();
      } else if (shape.type === "diamond") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.fillStyle = fillCol;
         this.drawDiamond(
        {
          x: shape.top.x ,
          y: shape.top.y ,
        },
        {
          x: shape.right.x ,
          y: shape.right.y ,
        },
        {
          x: shape.bottom.x ,
          y: shape.bottom.y ,
        },
        {
          x: shape.left.x ,
          y: shape.left.y ,
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
        shape.centerX ,
        shape.centerY ,
        Math.abs(shape.rx),
        Math.abs(shape.ry),
        0,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === "pencil") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.fillStyle = fillCol;
        const offsetPoints = shape.points.map((p) => ({
          x: p.x ,
          y: p.y ,
        }));
        this.drawPencilPath(offsetPoints);
      } else if (shape.type === "line" || shape.type === "arrow") {
        this.ctx.strokeStyle = strokeCol;
        this.ctx.fillStyle = fillCol;
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX , shape.startY );
        this.ctx.lineTo(shape.endX , shape.endY );
        this.ctx.stroke();
        this.ctx.closePath();
        if (shape.type === "arrow") {
          this.drawArrow(
            this.ctx,
            shape.startX ,
            shape.startY ,
            shape.endX ,
            shape.endY ,
            strokeCol
          );
        }
        if (
          this.selectedTool === "select" &&
          this.selectedShapeIndex === this.existingShapes.indexOf(shape)
        ) {
          this.drawLineHandles(shape);

        }
      } else if (shape.type === "text") {
        const fontSize = shape.fontSize || 20;
        const fillStyle = shape.strokeColor ?? (this.theme === "dark" ? "#fff" : "#000");
        this.ctx.save();
        this.ctx.font = `${fontSize}px Virgil`;
        this.drawMultilineText(shape.text, shape.x, shape.y, fontSize, fillStyle);
      }
      if (
        this.selectedTool === "select" &&
        this.selectedShapeIndex !== null &&
        this.existingShapes[this.selectedShapeIndex] === shape
      ) {
        this.drawSelectionBox(shape);
      }
      this.ctx.restore(); 
      });
      this.ctx.restore();
    }
    drawPencilPath(
      points: { x: number; y: number }[],
    ) {
      if (!points || points.length < 2) return;
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        this.ctx.lineTo(points[i].x, points[i].y);
      }
      this.ctx.stroke();
      this.ctx.closePath();
    }
    private deselectShape() {
  this.selectedShapeIndex = null;
  this.clearCanvas();
}

  mouseDownHandler = (e: MouseEvent) => {
    const pos = this.getMousePos(e);
    if (this.selectedTool === "hand") {
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      this.canvas.style.cursor = "grabbing";
      this.clearCanvas();
      return;
    }
    
    if (this.selectedTool === "select" && this.selectedShapeIndex !== null) {
      this.dragStartPos = { x: pos.x, y: pos.y };
      this.hasDragged = false;
    } else {
      this.dragStartPos = null;
      this.hasDragged = false;
    }
    
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
        this.dragMode = "move";
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
      this.deselectShape();
      return;
    }
  if (this.selectedTool === "eraser") {
  this.clicked = true;
  this.hoveredForErase = [];
  let deleted = false;
  let deletedShape: Shape | null = null;

  for (let i = this.existingShapes.length - 1; i >= 0; i--) {
    if (this.isPointInsideShape(pos.x, pos.y, this.existingShapes[i])) {
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
      this.safeSend({
          type: "shape_delete",
          roomId: this.roomId?.toString(),
          shapeId: deletedShape.id,
          encryptionKey: this.encryptionKey
  
        } , 2);
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
  dashPattern: number[] = []
): void {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.fillStyle = fillStyle;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dashPattern);

  const headLength = 10;
  const angle = Math.atan2(endY - startY, endX - startX);

  const arrowTipX = endX;
  const arrowTipY = endY;
  const leftX = arrowTipX - headLength * Math.cos(angle - Math.PI / 6);
  const leftY = arrowTipY - headLength * Math.sin(angle - Math.PI / 6);
  const rightX = arrowTipX - headLength * Math.cos(angle + Math.PI / 6);
  const rightY = arrowTipY - headLength * Math.sin(angle + Math.PI / 6);

  // Draw the main arrow shaft
  ctx.beginPath();
  ctx.moveTo(startX, startY);
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
  const pos = this.getMousePos(e);

  if (this.selectedTool === "hand" && this.isPanning) {
    this.isPanning = false;
    this.canvas.style.cursor = "grab";
    return;
  }

  if (this.dragMode !== "none") {
    this.dragMode = "none";
    this.activeHandle = null;
    if (this.selectedTool === "hand") {
      this.canvas.style.cursor = "grab";
    } else if (this.selectedTool === "select") {
      this.canvas.style.cursor = "default";
    } else {
      this.canvas.style.cursor = "crosshair";
    }
    this.clearCanvas();
    
    if (this.selectedShapeIndex !== null && this.hasDragged && !this.isNewlyCreated) {
      const shape = this.existingShapes[this.selectedShapeIndex];
      if (shape) {
        this.broadcastShapeUpdate(shape);
      }
    }
    
    this.dragStartPos = null;
    this.hasDragged = false;
  if (this.isNewlyCreated) {
      setTimeout(() => {
        this.isNewlyCreated = false;
      }, 500);
    }
    return;
  }
  this.clicked = false;


if (this.selectedTool === "pencil") {
  if (!this.pencilPoints || this.pencilPoints.length < 2) {
    this.pencilPoints = [];
    return;
  }


 const adjustedPoints = [...this.pencilPoints];


const last = adjustedPoints[adjustedPoints.length - 1];
  if (last.x !== pos.x || last.y !== pos.y) {
    adjustedPoints.push(pos);
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


  if (!this.isSolo) {
    this.broadcastShape(pencilShape);
  }
  this.scheduleLocalSave();

  // this.selectedTool = "select";
  // this.selectedShapeIndex = this.existingShapes.length - 1; 
  this.isNewlyCreated = true;
   setTimeout(() => {
    this.isNewlyCreated = false;
  }, 100);
  if (this.isSolo) {
    this.clearCanvas();
  } else {
    setTimeout(() => {
      this.clearCanvas();
    }, 50);
  }

  this.startX = null;
  this.startY = null;
  this.endX = null; 
  this.endY = null;
  this.pencilPoints = [];

  return;
}

  if (this.startX == null || this.startY == null) return;
  const minDistance = 5; 
const distance = Math.hypot(pos.x - this.startX, pos.y - this.startY);

const toolsRequiringMovement = ["line", "arrow", "rect", "circle", "diamond"];

if (distance < minDistance && toolsRequiringMovement.includes(this.selectedTool)) {
  this.startX = null;
  this.startY = null;
  this.endX = null;
  this.endY = null;
  return;
}
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
      this.broadcastShape(shape); 
    }
    this.scheduleLocalSave();

    this.selectedShapeIndex = this.existingShapes.length - 1;
    this.isNewlyCreated = true;
    setTimeout(() => {
      this.isNewlyCreated = false;
    }, 100)
    // if (this.onToolChange) this.onToolChange("select");
    // this.selectedTool = "select";
    if (this.isSolo) {
      this.clearCanvas();
    } else {
      setTimeout(() => {
        this.clearCanvas();
      }, 50);
    }
    return;
  }

  if (this.selectedTool === "eraser") {
    this.clicked = false;
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
      y: this.startY ,
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
    const cx = this.startX + width / 2;
    const cy = this.startY + height / 2;

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
    const cx = this.startX + (pos.x - this.startX) / 2;
    const cy = this.startY + (pos.y - this.startY) / 2;
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
      this.onTextInsert(pos.x, pos.y);
      this.clearCanvas();
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

this.selectedShapeIndex = this.existingShapes.length - 1;
this.isNewlyCreated = true;
setTimeout(() => {
  this.isNewlyCreated = false;
}, 100);
// this.selectedTool = "select";
// if (this.onToolChange) this.onToolChange("select");
if (this.isSolo) {
  this.clearCanvas(); 
} else {
  setTimeout(() => {
    this.clearCanvas();
  }, 50);
}

this.startX = null;
this.startY = null;
this.endX = null;
this.endY = null;
this.pencilPoints = [];
return;

};

private savePanOffset() {
  try {
    const key = this.getPanStorageKey();
    const panData = {
      panOffsetX: this.panOffsetX,
      panOffsetY: this.panOffsetY,
      zoom: this.zoom
    };
    localStorage.setItem(key, JSON.stringify(panData));
  } catch (err) {
    console.error("Failed to save pan offset to localStorage", err);
  }
}

private loadPanOffset() {
  try {
    const key = this.getPanStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      const panData = JSON.parse(saved);
      this.panOffsetX = panData.panOffsetX || 0;
      this.panOffsetY = panData.panOffsetY || 0;
      this.zoom = panData.zoom || 1;
    }
  } catch (err) {
    console.error("Failed to load pan offset from localStorage", err);
  }
}
private getPanStorageKey(): string {
  return this.isSolo ? "solo_pan_data" : `pan_data_${this.roomId}`;
}

public getScreenCoordinates(logicalX: number, logicalY: number): { x: number; y: number } {
  return {
    x: logicalX * this.zoom + this.panOffsetX,
    y: logicalY * this.zoom + this.panOffsetY
  };
}
  mouseMoveHandler = (e: MouseEvent) => {
  if (this.selectedTool === "select" && this.dragStartPos && !this.hasDragged) {
    const pos = this.getMousePos(e);
    const distance = Math.hypot(
      pos.x - this.dragStartPos.x, 
      pos.y - this.dragStartPos.y
    );
    
    if (distance > this.MIN_DRAG_DISTANCE) {
      this.hasDragged = true;
    }
  }
  
   if (this.selectedTool === "hand" && this.isPanning) {
    const dx = e.clientX - this.lastPanX;
    const dy = e.clientY - this.lastPanY;
    this.panOffsetX += dx;
    this.panOffsetY += dy;
    this.lastPanX = e.clientX;
    this.lastPanY = e.clientY;;
    this.savePanOffset();
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

          const x1 = shape.startX ;
          const y1 = shape.startY;
          const x2 = shape.endX;
          const y2 = shape.endY;

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
          } else if (this.isPointInsideShape(pos.x, pos.y, shape)) {
            this.canvas.style.cursor = "move";
          } else {
            this.canvas.style.cursor = "default";
          }
        }
      }
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

            }  else if (s.type === "diamond") {
              const currentCenterX = (s.top.x + s.bottom.x) / 2;
              const currentCenterY = (s.left.y + s.right.y) / 2;
              const currentWidth = Math.abs(s.right.x - s.left.x);
              const currentHeight = Math.abs(s.bottom.y - s.top.y);

              let newWidth = currentWidth;
              let newHeight = currentHeight;
              let newCenterX = currentCenterX;
              let newCenterY = currentCenterY;

              const h = this.activeHandle;
  
              if (h === "tl") {
                newCenterX = (p.x + s.right.x) / 2;
                newCenterY = (p.y + s.bottom.y) / 2;
                newWidth = Math.abs(s.right.x - p.x);
                newHeight = Math.abs(s.bottom.y - p.y);
              } else if (h === "tr") {
                newCenterX = (s.left.x + p.x) / 2;
                newCenterY = (p.y + s.bottom.y) / 2;
                newWidth = Math.abs(p.x - s.left.x);
                newHeight = Math.abs(s.bottom.y - p.y);
              } else if (h === "bl") {
                newCenterX = (p.x + s.right.x) / 2;
                newCenterY = (s.top.y + p.y) / 2;
                newWidth = Math.abs(s.right.x - p.x);
                newHeight = Math.abs(p.y - s.top.y);
              } else if (h === "br") {
                newCenterX = (s.left.x + p.x) / 2;
                newCenterY = (s.top.y + p.y) / 2;
                newWidth = Math.abs(p.x - s.left.x);
                newHeight = Math.abs(p.y - s.top.y);
              }

              s.top.x = newCenterX;
              s.top.y = newCenterY - newHeight / 2;
  
              s.right.x = newCenterX + newWidth / 2;
              s.right.y = newCenterY;
  
              s.bottom.x = newCenterX;
              s.bottom.y = newCenterY + newHeight / 2;
  
              s.left.x = newCenterX - newWidth / 2;
              s.left.y = newCenterY;

            }  else if ((s.type === "line" || s.type === "arrow") && this.activeHandle) {
              if (this.activeHandle === "start") {
      s.startX = p.x;
      s.startY = p.y;
    } else if (this.activeHandle === "end") {
      s.endX = p.x;
      s.endY = p.y;
    }
  }  else if (s.type === "text") {
    const h = this.activeHandle;
    const fontSize = s.fontSize || 20;
    this.ctx.font = `${fontSize}px Virgil`;
    const metrics = this.ctx.measureText(s.text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    let scaleX = 1;
    let scaleY = 1;

    if (h === "tl") {
      const originalBottomRightX = s.x + textWidth;
      const originalBottomRightY = s.y + textHeight;
      scaleX = Math.max(0.5, (originalBottomRightX - p.x) / textWidth);
      scaleY = Math.max(0.5, (originalBottomRightY - p.y) / textHeight);
    } else if (h === "tr") {
      const originalBottomLeftY = s.y + textHeight;
      scaleX = Math.max(0.5, (p.x - s.x) / textWidth);
      scaleY = Math.max(0.5, (originalBottomLeftY - p.y) / textHeight);
    } else if (h === "bl") {
      const originalTopRightX = s.x + textWidth;
      scaleX = Math.max(0.5, (originalTopRightX - p.x) / textWidth);
      scaleY = Math.max(0.5, (p.y - s.y) / textHeight);
    } else if (h === "br") {
      scaleX = Math.max(0.5, (p.x - s.x) / textWidth);
      scaleY = Math.max(0.5, (p.y - s.y) / textHeight);
    }
    const avgScale = (scaleX + scaleY) / 2;
    s.fontSize = Math.max(8, Math.min(100, fontSize * avgScale));
  }}
    this.clearCanvas();
    if (this.isSolo) {
    } else {
        this.scheduleWrite(s);
    }
    return;
    }
    if (this.selectedTool === "eraser" && this.clicked) {
      const logicalX = pos.x ;
      const logicalY = pos.y;

      for (let i = this.existingShapes.length - 1; i >= 0; i--) {
        if (this.isPointInsideShape(logicalX, logicalY, this.existingShapes[i])) {
          const shape = this.existingShapes[i];
          this.deleteShapeByIndex(i);
      if (!this.isSolo && shape) {
        this.safeSend({
            type: "shape_delete",
            roomId: this.roomId?.toString(),
            shapeId: shape.id,
            encryptionKey: this.encryptionKey

          },2);
        this.scheduleWriteAll();
      } else if (this.isSolo) {
        this.scheduleLocalSave?.();
      }

      this.clearCanvas(); 
      break; 
    }
  }
  return;
}


if (!this.clicked) return;

if (this.selectedTool === "pencil" && this.clicked) {
  const last = this.pencilPoints[this.pencilPoints.length - 1];
  const newX = pos.x;
  const newY = pos.y;
  if (!last || last.x !== newX || last.y !== newY) {
    this.pencilPoints.push({ x: newX, y: newY });
  }
  
  this.clearCanvas();
  this.ctx.save();
  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  this.ctx.translate(this.panOffsetX, this.panOffsetY);
  this.ctx.scale(this.zoom, this.zoom);
  
  this.ctx.strokeStyle = this.currentStrokeColor;
  this.ctx.lineWidth = this.currentStrokeWidth;
  this.ctx.setLineDash(this.getDashArray(this.currentStrokeStyle));
  
  this.drawPencilPath(this.pencilPoints);
  this.ctx.restore();
}

else {
  if (this.startX === null || this.startY === null) return;
  const width = pos.x - this.startX;
  const height = pos.y - this.startY;
  this.clearCanvas();
  const strokeCol = this.currentStrokeColor;
  const fillCol = this.currentBackgroundColor;
  const lineWidth = this.currentStrokeWidth;
  const dashArray = this.getDashArray(this.currentStrokeStyle);

  this.ctx.strokeStyle = strokeCol;
  this.ctx.fillStyle = fillCol;
  this.ctx.lineWidth = lineWidth;
  this.ctx.setLineDash(dashArray);
const drawX = (coord: number) => coord * this.zoom + this.panOffsetX;
const drawY = (coord: number) => coord * this.zoom + this.panOffsetY;
if (this.selectedTool === "rect") {
  const r = Math.min(
    this.MAX_CORNER_RADIUS,
    Math.abs(width) * 0.5,
    Math.abs(height) * 0.5
  );
  
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
  this.ctx.roundRect(
    drawX(this.startX), 
    drawY(this.startY), 
    width * this.zoom, 
    height * this.zoom, 
    r * this.zoom
  );
  this.ctx.fill();
  this.ctx.stroke();
  this.ctx.restore();


  this.ctx.restore();
} else if (this.selectedTool === "diamond") {
  const cx = this.startX + width / 2;
  const cy = this.startY + height / 2;
  const top = { x: drawX(cx), y: drawY(cy - height / 2) };
  const right = { x: drawX(cx + width / 2), y: drawY(cy) };
  const bottom = { x: drawX(cx), y: drawY(cy + height / 2) };
  const left = { x: drawX(cx - width / 2), y: drawY(cy) };

  this.drawDiamond(
    top,
    right,
    bottom,
    left,
    this.currentStrokeColor,              
    this.currentBackgroundColor,          
    this.getDashArray(this.currentStrokeStyle), 
    this.currentStrokeWidth              
  );
} else if (this.selectedTool === "circle") {
  const rx = Math.abs(width / 2);
  const ry = Math.abs(height / 2);
  const cx = this.startX + width / 2;
  const cy = this.startY + height / 2;
  this.ctx.save();
  this.ctx.strokeStyle = this.currentStrokeColor;
  this.ctx.fillStyle = this.currentBackgroundColor;
  this.ctx.lineWidth = this.currentStrokeWidth;
  this.ctx.setLineDash(this.getDashArray(this.currentStrokeStyle));
  this.ctx.beginPath();
  this.ctx.ellipse(drawX(cx), drawY(cy), rx * this.zoom, ry * this.zoom,0, 0, Math.PI * 2);
  this.ctx.fill();    
  this.ctx.stroke(); 
  this.ctx.closePath();
  this.ctx.restore();
}else if (this.selectedTool === "line") {
  this.ctx.save();
  this.ctx.strokeStyle = this.currentStrokeColor;
  this.ctx.lineWidth = this.currentStrokeWidth;
  this.ctx.setLineDash(this.getDashArray(this.currentStrokeStyle));
  this.ctx.beginPath();
  this.ctx.moveTo(drawX(this.startX), drawY(this.startY));
  this.ctx.lineTo(drawX(pos.x), drawY(pos.y));
  this.ctx.stroke();
  this.ctx.closePath();
  this.ctx.restore();

  this.endX = pos.x;
  this.endY = pos.y;
}
 else if (this.selectedTool === "arrow") {
 this.drawArrow(
  this.ctx,
  drawX(this.startX!),
  drawY(this.startY!),
  drawX(pos.x),
  drawY(pos.y),
  this.currentStrokeColor,              
  this.currentBackgroundColor,              
  this.currentStrokeWidth,                  
  this.getDashArray(this.currentStrokeStyle)
);
    this.endX = pos.x;
    this.endY = pos.y;
  } else if (this.selectedTool === "text") {
    if (!this.clicked) return;
    this.clearCanvas();
    this.ctx.fillStyle = this.currentStrokeColor;
    this.ctx.font = `${16 * this.zoom}px Arial`;
    this.ctx.fillText("Sample Text", drawX(pos.x), drawY(pos.y));
    this.ctx.restore();

  }
  this.ctx.restore();
}
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  };
}
