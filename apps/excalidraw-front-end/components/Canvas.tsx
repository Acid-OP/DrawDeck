"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Game } from "@/app/draw/Game";
import { ShareButton } from "./ShareButton";
import { TopBar } from "./TopBar";
import { Menu } from "./Menu";
import { ExcalidrawPropertiesPanel } from "./PropertiesPanel";
import { LiveCollabModal } from "./modal/LiveCollabModal";
import { ZoomBar } from "./ZoomBar";
import { Header } from "./Header";
import CurvedArrow from "./CurveArrow";
import LocalSaveNotice from "./menuiconpointer";
import ToolbarIcon from "./ToolBarIcon";
import ToolIconPointer from "./toolbariconpointer";

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

interface CanvasProps {
  roomName: string;
  socket: WebSocket | null;
  isSolo?: boolean;
}

export function Canvas({ roomName, socket, isSolo = false }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("hand");
  const [inputBox, setInputBox] = useState<{ x: number; y: number } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [strokeWidthIndex, setStrokeWidthIndex] = useState(1);
  const [strokeStyleIndex, setStrokeStyleIndex] = useState(0);
  const [fillIndex, setFillIndex] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

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

  const strokeWidths = [2, 3.5, 6];

  // Debounced resize handler for better performance
  const updateSize = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobile = width < 768; // Tailwind md breakpoint
    
    setDimensions({ width, height });
    setIsMobile(mobile);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const clearCanvasAndShapes = useCallback(() => {
    if (game) {
      game.clearAllShapes();
    }
  }, [game]);

  // Responsive resize handling
  useEffect(() => {
    if (typeof window === "undefined") return;

    updateSize();
    
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 150);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
    };
  }, [updateSize]);

  // Game state effects
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
    game.setStrokeStyle(strokeStyleIndex);
    game.setFillStyle(fillIndex);
  }, [game, strokeIndex, backgroundIndex, strokeWidthIndex, strokeStyleIndex, fillIndex]);

  // Game initialization
  useEffect(() => {
    if (canvasRef.current && dimensions.width !== 0 && dimensions.height !== 0) {
      const g = new Game(canvasRef.current, roomName, socket, isSolo, theme);
      g.onToolChange = (tool) => setSelectedTool(tool);
      g.onTextInsert = (x, y) => {
        if ((window as any).justBlurredTextInput) return;
        setInputBox({ x, y });
      };
      setGame(g);

      return () => g.destroy();
    }
  }, [canvasRef, isSolo, roomName, socket, dimensions, theme]);

  const shouldShowPropertiesPanel = ["rect", "diamond", "circle", "arrow", "line", "pencil", "text"].includes(selectedTool);

  return (
    <div className={`w-screen h-screen overflow-hidden relative ${theme === "dark" ? "bg-[#121212]" : "bg-white"}`}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="touch-none"
        style={{ backgroundColor: theme === "dark" ? "#121212" : "#ffffff" }}
      />

      {/* Header - Perfect center of screen */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
        <div className="pointer-events-auto">
          <Header />
        </div>
      </div>

      {/* Top UI Row - Maintaining original spacing */}
      <div className="absolute top-4 left-0 w-full flex justify-between items-center px-6">
        {/* Left: Menu */}
        <Menu 
          theme={theme} 
          onThemeToggle={toggleTheme} 
          onClearCanvas={clearCanvasAndShapes}
        />

        {/* Center: TopBar */}
        <TopBar 
          selectedTool={selectedTool} 
          setSelectedTool={setSelectedTool} 
          theme={theme} 
        />

        {/* Right: ShareButton */}
        <ShareButton onClick={() => setShowLiveModal(true)} />
      </div>

      {/* Curved Arrow - Fixed position relative to menu */}
      <div className="absolute top-16 left-15 transform -translate-x-1/2 pointer-events-none z-40">
        <CurvedArrow />
      </div>

      {/* Local Save Notice - Fixed position */}
      <div className="absolute top-40 left-66 transform -translate-x-1/2 pointer-events-none z-40">
        <LocalSaveNotice />
      </div>

      {/* Toolbar Icon - Below TopBar, centered */}
      <div className="absolute top-22 left-1/2 transform -translate-x-1/2 pl-8 pointer-events-none z-40">
        <ToolbarIcon />
      </div>

      {/* Tool Icon Pointer - Below Toolbar Icon, shifted left responsively */}
      <div className="absolute top-40 left-1/2 transform -translate-x-1/2 sm:-translate-x-32 md:-translate-x-40 lg:-translate-x-44 pointer-events-none z-40">
        <ToolIconPointer />
      </div>

      {/* Properties Panel - Maintaining original position */}
      {shouldShowPropertiesPanel && (
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

      {/* Text Input - responsive sizing */}
      {inputBox && (
        <textarea
          autoFocus
          rows={1}
          className="absolute bg-transparent px-0 py-0 m-0 border-none outline-none resize-none whitespace-pre-wrap break-words"
          style={{
            color: strokeColors[strokeIndex],
            font: `${isMobile ? '16px' : '20px'} Virgil, Segoe UI, sans-serif`,
            top: inputBox.y - 4,
            left: inputBox.x,
            minWidth: "1ch",
            maxWidth: isMobile ? "280px" : "500px",
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

      {/* Zoom Bar - Bottom right corner */}
      <div className="absolute bottom-4 right-4">
        <ZoomBar zoom={zoom} setZoom={setZoom} theme={theme} />
      </div>

      {/* Live Collab Modal */}
      {showLiveModal && (
        <LiveCollabModal onClose={() => setShowLiveModal(false)} />
      )}
    </div>
  );
}