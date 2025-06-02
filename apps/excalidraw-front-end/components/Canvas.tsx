"use client"

import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton";

import { Game } from "@/app/draw/Game";
import { ShareButton } from "./ShareButton";
import { TopBar } from "./TopBar";
export type Tool = "select" | "hand" | "rect" | "diamond" | "circle" | "arrow" | "line" | "pencil" | "text" | "eraser";
export function Canvas({roomId , socket}:{roomId:string , socket:WebSocket}){
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [game , setGame] = useState<Game>();
    const [selectedTool , setSelectedTool] = useState<Tool>("circle");

    useEffect(()=> {
        game?.setTool(selectedTool)
    }, [selectedTool,game]);

    useEffect(()=> {
        if(canvasRef.current){
            const g = new Game(canvasRef.current , roomId ,socket);
            setGame(g);

            return () => {
                g.destroy();
            }
        }

    }, [canvasRef]);

return (
  <div className="w-screen h-screen bg-[#121212] overflow-hidden relative">
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      style={{ backgroundColor: "#121212" }}
    />
    <div className="absolute top-4 left-0 w-full flex justify-between items-center px-6">
      <Menu />
      <TopBar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
      <ShareButton />
    </div>
  </div>
);

}

function Menu() {
  return (
    <div className="bg-[#232329] p-3 rounded-xl">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="#5f5f64"
        className="color-[#5f5f64]"
      >
        <path d="M 2 5 L 2 7 L 22 7 L 22 5 L 2 5 z M 2 11 L 2 13 L 22 13 L 22 11 L 2 11 z M 2 17 L 2 19 L 22 19 L 22 17 L 2 17 z" />
      </svg>
    </div>
  );
}



