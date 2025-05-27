
type Shape = {
    type : "rect";
    x: number;
    y: number;
    width : number;
    height : number;
} | {
    type : "circle";
    centerX : number;
    centerY : number;
    radius : number;
}

export function initDraw(canvas:HTMLCanvasElement){
        const ctx = canvas.getContext("2d");
            
        let existingShapes : Shape[] = [];
        if(!ctx){
            return;
        }
        ctx.fillStyle = "rgba(0,0,0)";
        ctx.fillRect(0,0,canvas.width,canvas.height);

        let clicked = false;
        let startX = 0;
        let startY = 0;

        canvas.addEventListener("mousedown" , (e)=> {
            clicked = true
            startX = e.clientX
            startY = e.clientY
        })

        canvas.addEventListener("mouseup" , (e)=> {
            clicked = false
            const width = e.clientX - startX;
            const height = e.clientY - startY;
            existingShapes.push({
                type:"rect",
                x : startX,
                y : startY,
                height,
                width
                })
            })

        canvas.addEventListener("mousemove" , (e)=> {
            if(clicked){
                const width = e.clientX - startX;
                const height = e.clientY - startY;
                clearCanvas(existingShapes , canvas , ctx);
                ctx.strokeRect(startX , startY, width , height);
            }    
        })

        function clearCanvas(existingShapes: Shape[] , canvas: HTMLCanvasElement , ctx: CanvasRenderingContext2D){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            ctx.fillStyle = "rgba(0,0,0)"
            ctx.fillRect(0,0,canvas.width,canvas.height);

            existingShapes.map((shape) => {
                if(shape.type === "rect") {
                ctx.strokeStyle = "rgba(255,255,255)"
                ctx.strokeRect(shape.x , shape.y , shape.width , shape.height);
                }
            })
        }
}