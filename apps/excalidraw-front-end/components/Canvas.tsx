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
  isUserAuthenticated?: boolean; 
}

export function Canvas({ roomName, socket, isSolo = false, isUserAuthenticated = false }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [hasInteracted, setHasInteracted] = useState(false);
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
  // const [isLoading, setIsLoading] = useState(true);

  const getStrokeColors = (theme: "light" | "dark") => [
    theme === "dark" ? '#ffffff' : '#1e1e1e',
    '#e03131',
    '#2f9e44',
    '#1971c2',
    '#f08c00'
  ];

  const backgroundColors = [
    'transparent',
    '#ffc9c9',
    '#b2f2bb',
    '#a5d8ff',
    '#ffec99'
  ];

  const strokeWidths = [2, 3.5, 6];

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    if (isSolo) {
      const modalShown = sessionStorage.getItem('collabModalShown');
      if (!modalShown) {
        setShowLiveModal(true);
      }
    }
  }, [isSolo]);

  const updateSize = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobile = width < 768;
    
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

  const handleCloseModal = useCallback(() => {
    sessionStorage.setItem('collabModalShown', 'true');
    setShowLiveModal(false);
  }, []);

  const handleShareButtonClick = useCallback(() => {
    setShowLiveModal(true);
  }, []);

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

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (selectedTool !== "hand" && !hasInteracted) {
      setHasInteracted(true);
    }
  }, [selectedTool]);

  useEffect(() => {
    if (game && !hasInteracted && game.hasShapes()) {
      setHasInteracted(true);
    }
  }, [game, hasInteracted]);

  useEffect(() => {
    if (game) {
      game.zoom = zoom;
      game.clearCanvas();
    }
  }, [zoom, game]);

  useEffect(() => {
    if (game) {
      game.setTheme(theme);
    }
  }, [theme, game]);

  useEffect(() => {
    if (!game) return;
    const currentStrokeColors = getStrokeColors(theme);
    game.setStrokeColor(currentStrokeColors[strokeIndex]);
    game.setBackgroundColor(backgroundColors[backgroundIndex]);
    game.setStrokeWidth(strokeWidths[strokeWidthIndex]);
    game.setStrokeStyle(strokeStyleIndex);
    game.setFillStyle(fillIndex);
  }, [game, strokeIndex, backgroundIndex, strokeWidthIndex, strokeStyleIndex, fillIndex]);

  useEffect(() => {
    if (canvasRef.current && dimensions.width !== 0 && dimensions.height !== 0) {
      const g = new Game(canvasRef.current, roomName, socket, isSolo, theme);
      g.onToolChange = (tool) => setSelectedTool(tool);
      g.onTextInsert = (x, y) => {
        if ((window as any).justBlurredTextInput) return;
        setInputBox({ x, y });
      };
      setGame(g);
      // setIsLoading(false);

      return () => g.destroy();
    }
  }, [canvasRef, isSolo, roomName, socket, dimensions, theme]);

  const shouldShowPropertiesPanel = ["rect", "diamond", "circle", "arrow", "line", "pencil", "text"].includes(selectedTool);
  
  const shouldShowWelcome = game && !hasInteracted && !game.hasShapes();

  // if (isLoading) {
  //   return <LoadingScreen/>;
  // }
  
  return (
    <div className={`w-screen h-screen overflow-hidden relative ${theme === "dark" ? "bg-[#121212]" : "bg-white"}`}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="touch-none"
        style={{ backgroundColor: theme === "dark" ? "#121212" : "#ffffff" }}
      />
      
      {shouldShowWelcome && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <Header theme={theme}/>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-0 w-full flex justify-between items-center px-6">
        <Menu 
          theme={theme} 
          onThemeToggle={toggleTheme} 
          onClearCanvas={clearCanvasAndShapes}
        />

        <TopBar 
          selectedTool={selectedTool} 
          setSelectedTool={setSelectedTool} 
          theme={theme} 
        />

        <ShareButton onClick={handleShareButtonClick} />
      </div>
      
      {shouldShowWelcome && (
        <>
          <div className="absolute top-16 left-15 transform -translate-x-1/2 pointer-events-none z-40">
            <CurvedArrow />
          </div>
          <div className="absolute top-40 left-66 transform -translate-x-1/2 pointer-events-none z-40">
            <LocalSaveNotice />
          </div>

          <div className="absolute top-22 left-1/2 transform -translate-x-1/2 pl-8 pointer-events-none z-40">
            <ToolbarIcon />
          </div>

          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 sm:-translate-x-32 md:-translate-x-40 lg:-translate-x-44 pointer-events-none z-40">
            <ToolIconPointer />
          </div>
        </>
      )}

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

      {inputBox && (
        <textarea
          autoFocus
          rows={1}
          className="absolute bg-transparent px-0 py-0 m-0 border-none outline-none resize-none whitespace-pre-wrap break-words"
          style={{
            color: getStrokeColors(theme)[strokeIndex],
            font: `${isMobile ? '16px' : '20px'} Virgil, Segoe UI, sans-serif`,
            top: inputBox.y,
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

      <div className="absolute bottom-4 right-4">
        <ZoomBar zoom={zoom} setZoom={setZoom} theme={theme} />
      </div>

      {showLiveModal && (
        <LiveCollabModal onClose={handleCloseModal} />
      )}
    </div>
  );
}