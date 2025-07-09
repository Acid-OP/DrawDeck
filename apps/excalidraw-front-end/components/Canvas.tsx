"use client";

import { useEffect, useRef, useState } from "react";
import { Game } from "@/app/draw/Game";
import { ShareButton } from "./ShareButton";
import { TopBar } from "./TopBar";
import { Menu } from "./Menu";

export type Tool =
  | "hand"
  | "select"
  | "rect"
  | "diamond"
  | "circle"
  | "arrow"
  | "line"
  | "pencil"
  | "text"
  | "eraser";

export function Canvas({
  roomId,
  socket,
  isSolo = false,
}: {
  roomId: number;
  socket: WebSocket | null;
  isSolo?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("hand");
  const [inputBox, setInputBox] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize(); // once on mount
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current && dimensions.width !== 0 && dimensions.height !== 0) {
      const g = new Game(canvasRef.current, roomId, socket, isSolo);
      g.onToolChange = (tool) => setSelectedTool(tool);
      g.onTextInsert = (x, y) => {
        if ((window as any).justBlurredTextInput) return;
        setInputBox({ x, y });
      };
      setGame(g);

      return () => g.destroy();
    }
  }, [canvasRef, isSolo, roomId, socket, dimensions]);

  return (
    <div className="w-screen h-screen bg-[#121212] overflow-hidden relative">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ backgroundColor: "#121212" }}
      />

      <div className="absolute top-4 left-0 w-full flex justify-between items-center px-6">
        <Menu />
        <TopBar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
        <ShareButton />
      </div>

      {inputBox && (
        <textarea
          autoFocus
          rows={1}
          className="absolute text-white bg-transparent px-0 py-0 m-0 border-none outline-none resize-none font-[16px] leading-[1.2] font-[Arial] whitespace-pre-wrap break-words"
          style={{
            top: inputBox.y,
            left: inputBox.x,
            minWidth: "1ch",
            maxWidth: "500px",
            overflow: "hidden",
          }}
          onBlur={(e) => {
            if (game && e.target.value.trim()) {
              game.addTextShape(inputBox.x, inputBox.y, e.target.value);
            }
            (window as any).justBlurredTextInput = true;
            setInputBox(null);
            setTimeout(() => {
              (window as any).justBlurredTextInput = false;
            }, 300);
          }}
        />
      )}
    </div>
  );
}
