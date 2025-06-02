"use client"

import { useEffect, useRef, useState } from "react";

import { Game } from "@/app/draw/Game";
import { ShareButton } from "./ShareButton";
import { TopBar } from "./TopBar";
import { Menu } from "./Menu";
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
      <ShareButton/>
    </div>
  </div>
);

}





