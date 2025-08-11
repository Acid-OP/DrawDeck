import {
  Circle,
  Diamond,
  Eraser,
  Hand,
  Type,
  Minus,
  MousePointer,
  MoveRight,
  Pencil,
  Square
} from "lucide-react";
import { IconButton } from "./IconButton";
import { Tool } from "./Canvas";
import { useState, useEffect } from "react";

interface TopBarProps {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
  theme: "light" | "dark";
}

export function TopBar({ selectedTool, setSelectedTool, theme }: TopBarProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      className={`
        flex rounded-md cursor-pointer transition-all py-1 px-2
        ${isMobile ? 'gap-0.5' : 'gap-1.5'}
        ${theme === "dark" ? "bg-[#232329]" : "bg-white border border-gray-200"}
      `}
    >
      <IconButton 
        theme={theme} 
        activated={selectedTool === "hand"} 
        icon={<Hand />} 
        shortcutKey={1} 
        onClick={() => setSelectedTool("hand")}
        isMobile={isMobile}
      />
      <IconButton 
        theme={theme} 
        activated={selectedTool === "select"} 
        icon={<MousePointer />} 
        shortcutKey={2} 
        onClick={() => setSelectedTool("select")}
        isMobile={isMobile}
      />
      <IconButton 
        theme={theme} 
        activated={selectedTool === "rect"} 
        icon={<Square />} 
        shortcutKey={3} 
        onClick={() => setSelectedTool("rect")}
        isMobile={isMobile}
      />
      <IconButton 
        theme={theme} 
        activated={selectedTool === "diamond"} 
        icon={<Diamond />} 
        shortcutKey={4} 
        onClick={() => setSelectedTool("diamond")}
        isMobile={isMobile}
      />
      <IconButton 
        theme={theme} 
        activated={selectedTool === "circle"} 
        icon={<Circle />} 
        shortcutKey={5} 
        onClick={() => setSelectedTool("circle")}
        isMobile={isMobile}
      />
      <IconButton 
        theme={theme} 
        activated={selectedTool === "arrow"} 
        icon={<MoveRight />} 
        shortcutKey={6} 
        onClick={() => setSelectedTool("arrow")}
        isMobile={isMobile}
      />
      <IconButton 
        theme={theme} 
        activated={selectedTool === "line"} 
        icon={<Minus />} 
        shortcutKey={7} 
        onClick={() => setSelectedTool("line")}
        isMobile={isMobile}
      />
      <IconButton 
        theme={theme} 
        activated={selectedTool === "pencil"} 
        icon={<Pencil />} 
        shortcutKey={8} 
        onClick={() => setSelectedTool("pencil")}
        isMobile={isMobile}
      />
      <IconButton 
        theme={theme} 
        activated={selectedTool === "text"} 
        icon={<Type />} 
        shortcutKey={9} 
        onClick={() => setSelectedTool("text")}
        isMobile={isMobile}
      />
      <IconButton 
        theme={theme} 
        activated={selectedTool === "eraser"} 
        icon={<Eraser />} 
        shortcutKey={10} 
        onClick={() => setSelectedTool("eraser")}
        isMobile={isMobile}
      />
    </div>
  );
}