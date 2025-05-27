"use client"
import { initDraw } from "@/app/draw/page";
import { useEffect } from "react";
import { useRef } from "react"

export default function Canvas(){

    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(()=> {
        if(canvasRef.current){
            initDraw(canvasRef.current);
        }

    }, [canvasRef]);

    return <div>
        <canvas ref={canvasRef} width={2000} height={1000}></canvas>
    </div>
}