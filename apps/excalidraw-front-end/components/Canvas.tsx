"use client";

import { useEffect, useRef, useState } from "react";
import { Game } from "@/app/draw/Game";
import { ShareButton } from "./ShareButton";
import { TopBar } from "./TopBar";
import { Menu } from "./Menu";
import { ExcalidrawPropertiesPanel } from "./PropertiesPanel";
import { LiveCollabModal } from "./modal/LiveCollabModal";
import { ZoomBar } from "./ZoomBar";

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
  roomName,
  socket,
  isSolo = false,
}: {
  roomName: string;
  socket: WebSocket | null;
  isSolo?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("hand");
  const [inputBox, setInputBox] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({width: 0,height: 0,});
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [strokeIndex, setStrokeIndex] = useState(0);           // e.g., black
  const [backgroundIndex, setBackgroundIndex] = useState(0);   // e.g., transparent
  const [strokeWidthIndex, setStrokeWidthIndex] = useState(1); // e.g., medium
  const [strokeStyleIndex, setStrokeStyleIndex] = useState(0); // solid
  const [fillIndex, setFillIndex] = useState(0);               // hachure
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const strokeColors = [
    '#1e1e1e', // Black
    '#e03131', // Red
    '#2f9e44', // Green
    '#1971c2', // Blue
    '#f08c00'  // Orange
  ];

  const backgroundColors = [
    'transparent',
    '#ffc9c9', // Light Red
    '#b2f2bb', // Light Green
    '#a5d8ff', // Light Blue
    '#ffec99'  // Light Yellow
  ];

  const strokeWidths = [2, 3.5, 6]; // px
  // Add style/fill arrays if needed!

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };
  const [zoom, setZoom] = useState(1);
// minZoom, maxZoom, zoomStep can be left as defaults, or customized

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);
  
  useEffect(() => {
    if (game) {
      game.setTheme(theme);
    }
  }, [theme, game]);
useEffect(() => {
  if (!game) return;
  game.setStrokeColor(strokeColors[strokeIndex]);
  game.setBackgroundColor(backgroundColors[backgroundIndex]);
  game.setStrokeWidth(strokeWidths[strokeWidthIndex]);
  game.setStrokeStyle(strokeStyleIndex); // Map index to line style if needed
  game.setFillStyle(fillIndex);           // Map index to fill style if needed
}, [
  game,
  strokeIndex,
  backgroundIndex,
  strokeWidthIndex,
  strokeStyleIndex,
  fillIndex
]);

  useEffect(() => {
    if (canvasRef.current && dimensions.width !== 0 && dimensions.height !== 0) {
      const g = new Game(canvasRef.current, roomName, socket, isSolo , theme);
      g.onToolChange = (tool) => setSelectedTool(tool);
      g.onTextInsert = (x, y) => {
        if ((window as any).justBlurredTextInput) return;
        setInputBox({ x, y });
      };
      setGame(g);

      return () => g.destroy();
    }
  }, [canvasRef, isSolo, roomName, socket, dimensions]);



  return (
    <div className={`w-screen h-screen overflow-hidden relative ${theme === "dark" ? "bg-[#121212]" : "bg-white"}`}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ backgroundColor: theme === "dark" ? "#121212" : "#ffffff" }}
      />
      <div className="absolute top-4 left-0 w-full flex justify-between items-center px-6">
        <Menu theme={theme} onThemeToggle={toggleTheme} />
        <TopBar selectedTool={selectedTool} setSelectedTool={setSelectedTool} theme={theme} />
        {["rect", "diamond", "circle", "arrow", "line", "pencil", "text"].includes(selectedTool) && (
          <div className="absolute top-[72px] left-6 z-50">
            <ExcalidrawPropertiesPanel
            strokeSelectedIndex={strokeIndex}
            backgroundSelectedIndex={backgroundIndex}
            strokeWidthSelectedIndex={strokeWidthIndex}
            strokeStyleSelectedIndex={strokeStyleIndex}
            fillSelectedIndex={fillIndex}
            onStrokeColorSelect={setStrokeIndex}
            onBackgroundColorSelect={setBackgroundIndex}
            onStrokeWidthSelect={setStrokeWidthIndex}
            onStrokeStyleSelect={setStrokeStyleIndex}
            onFillStyleSelect={setFillIndex}
            theme={theme}
            onThemeToggle={toggleTheme}
          />
          </div>
        )}
        <ShareButton onClick={() => setShowLiveModal(true)} />
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
      {showLiveModal && (
        <LiveCollabModal onClose={() => setShowLiveModal(false)} />
        )}
        <ZoomBar zoom={zoom} setZoom={setZoom} theme={theme} />
    </div>
  );
}
