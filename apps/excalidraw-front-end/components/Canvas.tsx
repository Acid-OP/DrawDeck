"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Game } from "@/app/draw/Game";
import { ShareButton } from "./ShareButton";
import { TopBar } from "./TopBar";
import { Menu } from "./Menu";
import { ExcalidrawPropertiesPanel } from "./PropertiesPanel";
import { LiveCollabModal } from "./modal/LiveCollabModal";
import { ShareLinkModal } from "./modal/SharelinkModal";
import { ZoomBar } from "./ZoomBar";
import { Header } from "./Header";
import CurvedArrow from "./CurveArrow";
import LocalSaveNotice from "./menuiconpointer";
import ToolbarIcon from "./ToolBarIcon";
import ToolIconPointer from "./toolbariconpointer";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "@/context/ThemeContext";
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
  roomId: string;
  socket: WebSocket | null;
  isSolo?: boolean;
  isUserAuthenticated?: boolean;
  encryptionKey?: string;
  roomType?: 'duo' | 'group';
  className?: string;
  sendMessage?: (message: any, priority?: number) => boolean;
  rateLimitState?: {
    messagesRemaining: number;
    lastReset: number;
    isBlocked: boolean;
    blockUntil: number;
    retryAfter: number;
  };
}

export function Canvas({ roomId, socket, isSolo = false, isUserAuthenticated = false, encryptionKey, roomType,className , sendMessage, rateLimitState }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [textareaRows, setTextareaRows] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool>("hand");
  const { getToken } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputBox, setInputBox] = useState<{ 
    x: number; 
    y: number; 
    logicalX: number; 
    logicalY: number; 
  } | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showShareLinkModal, setShowShareLinkModal] = useState(false);
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  const [strokeWidthIndex, setStrokeWidthIndex] = useState(1);
  const [strokeStyleIndex, setStrokeStyleIndex] = useState(0);
  const [fillIndex, setFillIndex] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  const isCollabMode = !isSolo && roomType && encryptionKey;

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

  const updateSize = useCallback(() => {
    if (typeof window === "undefined") return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const mobile = width < 768;
    
    setDimensions({ width, height });
    setIsMobile(mobile);
  }, []);


  const clearCanvasAndShapes = useCallback(() => {
    console.log('clearCanvasAndShapes called, game:', game);
    if (game) {
       console.log('Calling clearAllShapes');
      game.clearAllShapes();
    }
  }, [game]);

  const handleCloseLiveModal = useCallback(() => {
    sessionStorage.setItem('collabModalShown', 'true');
    setShowLiveModal(false);
  }, []);

useEffect(() => {
  if (!inputBox || !textareaRef.current) return;

  const textarea = textareaRef.current;
  
  const focusTextarea = () => {
    textarea.focus();
    const len = textarea.value.length;
    textarea.setSelectionRange(len, len);

    if (isMobile) {
      textarea.click();
    }
  };

  requestAnimationFrame(() => {
    setTimeout(focusTextarea, isMobile ? 150 : 50);
  });
}, [inputBox, isMobile]);
useEffect(() => {
  if (!inputBox) return;

  const handleTouchStart = (ev: TouchEvent) => {
    const textarea = textareaRef.current;
    if (!textarea || document.activeElement !== textarea) return;

    const rect = textarea.getBoundingClientRect();
    const touch = ev.touches[0];
    const isInsideTextarea = 
      touch.clientX >= rect.left && touch.clientX <= rect.right &&
      touch.clientY >= rect.top && touch.clientY <= rect.bottom;

    if (!isInsideTextarea) {
      ev.preventDefault();
      textarea.blur();
    }
  };

  document.addEventListener('touchstart', handleTouchStart);
  return () => document.removeEventListener('touchstart', handleTouchStart);
}, [inputBox]);
useEffect(() => {
  if (!inputBox || !textareaRef.current || !isMobile) return;

  const textarea = textareaRef.current;
  
  const handleTouchEnd = (e: TouchEvent) => {
    e.stopPropagation();
    if (document.activeElement !== textarea) {
      setTimeout(() => textarea.focus(), 10);
    }
  };

  textarea.addEventListener('touchend', handleTouchEnd);
  return () => textarea.removeEventListener('touchend', handleTouchEnd);
}, [inputBox, isMobile]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const lines = textarea.value.split('\n').length;
    const maxRows = 10;
    setTextareaRows(Math.min(lines, maxRows));
  }, []);

  const handleCloseShareLinkModal = useCallback(() => {
    setShowShareLinkModal(false);
  }, []);

  const handleShareButtonClick = useCallback(() => {
    if (isCollabMode) {
      setShowShareLinkModal(true);
    } else {
      setShowLiveModal(true);
    }
  }, [isCollabMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    updateSize();
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateSize, 150);
    };

    window.addEventListener("resize", debouncedResize);
    
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    
    return () => {
      window.removeEventListener("resize", debouncedResize);
      clearTimeout(timeoutId);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [updateSize, isMobile]);

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
      game.toggleDefaultStrokeColors(theme);
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
    const keyToPass = isSolo ? null : (encryptionKey || null);
    const g = new Game(canvasRef.current, roomId, socket, isSolo, theme, keyToPass , sendMessage);
    g.onToolChange = (tool) => setSelectedTool(tool);
    g.onTextInsert = (logicalX, logicalY) => {
      if ((window as any).justBlurredTextInput) return;
      const screenX = logicalX * g.zoom + g.panOffsetX;
      const screenY = logicalY * g.zoom + g.panOffsetY;
      setInputBox({ x: screenX, y: screenY, logicalX, logicalY });
    };
    g.initTouchHandlers();
    
    setGame(g);
    return () => g.destroy();
  }
}, [canvasRef, isSolo, roomId, socket, dimensions, theme, encryptionKey , sendMessage]);

  const shouldShowPropertiesPanel = ["rect", "diamond", "circle", "arrow", "line", "pencil", "text"].includes(selectedTool);
  
  const shouldShowWelcome = game && !hasInteracted && !game.hasShapes() && isSolo;
  
  return (
    <div className={`w-screen h-screen overflow-hidden relative ${theme === "dark" ? "bg-[#121212]" : "bg-white"} ${className || ''}`}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="" 
        style={{ backgroundColor: theme === "dark" ? "#121212" : "#ffffff" }}
      />
      
      {shouldShowWelcome && (
        <div className="absolute top-[55%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="pointer-events-auto">
            <Header/>
          </div>
        </div>
      )}
      {!isMobile && (
        <div className="absolute top-3 left-0 w-full flex justify-between items-start px-4 touch-none">
          <div className="flex-shrink-0">
            <Menu 
              onClearCanvas={clearCanvasAndShapes}
              isMobile={false}
                onOpen={() => setIsMenuOpen(true)}
                onClose={() => setIsMenuOpen(false)}
              {...(isCollabMode && {
                isCollabMode: true,
                roomId: roomId,
                encryptionKey: encryptionKey,
                roomType: roomType
              })}
            />
          </div>

          <div className="flex-1 flex justify-center">
            <TopBar 
              selectedTool={selectedTool} 
              setSelectedTool={setSelectedTool}  
            />
          </div>

          <div className="flex-shrink-0">
            <ShareButton 
              onClick={handleShareButtonClick} 
              isCollabMode={!!isCollabMode}
            />
          </div>
        </div>
      )}

      {isMobile && (
        <>
          <div className="fixed top-3 left-3 right-3 z-50 flex justify-center touch-none">
            <div>
              <TopBar 
                selectedTool={selectedTool} 
                setSelectedTool={setSelectedTool} 
              />
            </div>
          </div>
          
          <div className="fixed bottom-3 left-3 right-3 z-50 touch-none">
            <div className={`rounded-md py-1 px-2 flex items-center justify-between gap-2
            ${theme === "dark" ? "bg-[#232329]" : "bg-white border border-gray-200"}
            `}>
              <div className={`flex-shrink-0`}>
                <Menu 
                  onClearCanvas={clearCanvasAndShapes}
                  isMobile={true}
                  {...(isCollabMode && {
                    isCollabMode: true,
                    roomId: roomId,
                    encryptionKey: encryptionKey,
                    roomType: roomType
                  })}
                />
              </div>
              <div className={`rounded flex-shrink-0 ml-auto`}>
                <ZoomBar zoom={zoom} setZoom={setZoom}/>
              </div>      
            </div>
          </div>
        </>
      )}
      
      {!isMobile && (
        <div className="absolute bottom-4 right-4 touch-none">
          <ZoomBar zoom={zoom} setZoom={setZoom}/>
        </div>
      )}

      {shouldShowWelcome &&
        <>
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 ml-8 pointer-events-none z-40">
           <ToolbarIcon />
          </div>

          <div className="absolute top-35 left-1/2 transform -translate-x-1/2 pointer-events-none z-40" style={{ marginLeft: '-3rem' }}>
           <ToolIconPointer />
          </div>
          {!isMobile && (
            <>
          <div className="absolute top-12 -left-1 pointer-events-none z-40">
            <CurvedArrow />
          </div>

          <div className="absolute top-32 left-18 pointer-events-none z-40">
            <LocalSaveNotice />
          </div>
            </>
          )}
        </>
      }

      {shouldShowPropertiesPanel && !isMobile && !isMenuOpen && (
        <div className="absolute top-[72px] left-6 z-50 touch-none">
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
          />
        </div>
      )}
      {inputBox && (
        <textarea
        ref={textareaRef}
        rows={textareaRows}
        className="absolute bg-transparent px-0 py-0 m-0 border-none outline-none resize-none whitespace-pre-wrap break-words"
        style={{
          color: getStrokeColors(theme)[strokeIndex],
          font: `${isMobile ? '16px' : '20px'} Virgil, Segoe UI, sans-serif`,
          top: inputBox.y,
          left: inputBox.x,
          minWidth: "1ch",
          maxWidth: isMobile ? "280px" : "500px",
          overflow: "hidden",
          touchAction: 'manipulation',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'text',
        }}
        onChange={handleTextareaChange}
        onTouchStart={(e) => {
          e.stopPropagation();
          if (document.activeElement !== e.currentTarget) {
            e.currentTarget.focus();
          }
        }}
        onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {  
          if (game && e.target.value.trim()) {
            game.addTextShape(inputBox.logicalX, inputBox.logicalY, e.target.value);
          }
          (window as any).justBlurredTextInput = true;
          setInputBox(null);
          setTextareaRows(1);
          setTimeout(() => {
            (window as any).justBlurredTextInput = false;
          }, 300);
         }}
      />
    )}

      {showLiveModal && (
        <LiveCollabModal onClose={handleCloseLiveModal} source="share" />
      )}

      {showShareLinkModal && isCollabMode && (
        <ShareLinkModal 
          roomId={roomId}
          encryptionKey={encryptionKey!}
          roomType={roomType!}
          onClose={handleCloseShareLinkModal}
          isManualTrigger={true}
        />
      )}
    </div>
  );
}