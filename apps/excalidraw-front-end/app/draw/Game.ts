import { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    radius : number;
} | {
    type: "circle";
    centerX: number;
    centerY: number;
    radius: number;
} | {
    type: "line";
    startX: number;
    startY: number;
    endX: number;
    endY: number;
} | {
    type: "pencil",
    points: { x: number; y: number }[];
} | {
    type : "arrow";
    startX: number;
    startY: number; 
    endX: number; 
    endY: number 
} | {
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

    socket: WebSocket;

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

    getMousePos = (e: MouseEvent) => {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
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
        this.ctx.fillStyle = "rgba(0, 0, 0)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.existingShapes.forEach((shape) => {
            if (shape.type === "rect") {
                this.ctx.strokeStyle = "rgba(255, 255, 255)";
                this.ctx.beginPath();
                this.ctx.roundRect(shape.x, shape.y, shape.width, shape.height, 16);
                this.ctx.stroke();
            } else if (shape.type === "circle") {
                this.ctx.beginPath();
                this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
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
                this.drawArrow(this.ctx, shape.startX, shape.startY, shape.endX, shape.endY);
            } else if (shape.type === "text") {
                this.ctx.fillStyle = "rgba(255, 255, 255)";
                this.ctx.font = "16px Arial";  // You can adjust font size and family here
                this.ctx.fillText(shape.text, shape.x, shape.y);
            }
        });
    }

    drawPencilPath(points: { x: number, y: number }[]) {
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
        } else {
            this.startX = pos.x;
            this.startY = pos.y;
            this.endX = pos.x;
            this.endY = pos.y;
        }
    }
    drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
        const headLength = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY); // main line

        // left side of arrowhead
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6),
            toY - headLength * Math.sin(angle - Math.PI / 6));

        // right side of arrowhead
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6),
            toY - headLength * Math.sin(angle + Math.PI / 6));

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
                radius : 10
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
            if (this.startX === null || this.startY === null || this.endX === null || this.endY === null) return;
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
            if (this.startX === null || this.startY === null) return;
            shape = {
                type: "arrow",
                startX: this.startX,
                startY: this.startY,
                endX: pos.x,
                endY: pos.y
            };
        } else if (this.selectedTool === "text") {
            shape = {
                type: "text",
                x: pos.x,
                y: pos.y,
                text: "Sample Text", // temporary placeholder text, replace later
            };
        }

        if (!shape) return;

        this.existingShapes.push(shape);
        this.socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shape }),
            roomId: this.roomId,
        }));

        this.clearCanvas();

        this.startX = null;
        this.startY = null;
        this.endX = null;
        this.endY = null;
        this.pencilPoints = [];
    }

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

            if (this.selectedTool === "rect") {
                this.ctx.beginPath();
                this.ctx.roundRect(this.startX, this.startY, width, height, 10);
                this.ctx.stroke();

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
    }

    initMouseHandlers() {
        this.canvas.addEventListener("mousedown", this.mouseDownHandler);
        this.canvas.addEventListener("mouseup", this.mouseUpHandler);
        this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
    }
}
