"use client"
import { useEffect } from "react";
import { useRef } from "react"

export default function Canvas(){

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(()=> {
        if(canvasRef.current){
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            
            if(!ctx){
                return;
            }

            let clicked = false;
            let StartX = 0;
            let StartY = 0;

            canvas.addEventListener("mousedown" , (e)=> {
                clicked = true
                StartX = e.clientX
                StartY = e.clientY

            })

                canvas.addEventListener("mouseup" , (e)=> {
                clicked = false
                console.log(e.clientX)
                console.log(e.clientY)

            })

                canvas.addEventListener("mousemove" , (e)=> {
                if(clicked){
                    const width = e.clientX - StartX;
                    const height = e.clientY - StartY;

                    ctx.clearRect(0,0,canvas.width,canvas.height);
                    ctx.strokeRect(StartX , StartY, width , height);

                }

            })
        }

    }, [canvasRef]);

    return <div>
        <canvas ref={canvasRef} width={500} height={500}></canvas>
    </div>
}