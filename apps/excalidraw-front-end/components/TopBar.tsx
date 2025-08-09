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

interface TopBarProps {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
  theme: "light" | "dark";
}

export function TopBar({ selectedTool, setSelectedTool, theme }: TopBarProps) {
  return (
    <div
      className={`
        flex gap-1.5 rounded-md cursor-pointer transition-all py-1 px-2
        ${theme === "dark" ? "bg-[#232329]" : "bg-white border border-gray-200"}
      `}
    >
      <IconButton theme={theme} activated={selectedTool === "hand"} icon={<Hand />} shortcutKey={1} onClick={() => setSelectedTool("hand")} />
      <IconButton theme={theme} activated={selectedTool === "select"} icon={<MousePointer />} shortcutKey={2} onClick={() => setSelectedTool("select")} />
      <IconButton theme={theme} activated={selectedTool === "rect"} icon={<Square />} shortcutKey={3} onClick={() => setSelectedTool("rect")} />
      <IconButton theme={theme} activated={selectedTool === "diamond"} icon={<Diamond />} shortcutKey={4} onClick={() => setSelectedTool("diamond")} />
      <IconButton theme={theme} activated={selectedTool === "circle"} icon={<Circle />} shortcutKey={5} onClick={() => setSelectedTool("circle")} />
      <IconButton theme={theme} activated={selectedTool === "arrow"} icon={<MoveRight />} shortcutKey={6} onClick={() => setSelectedTool("arrow")} />
      <IconButton theme={theme} activated={selectedTool === "line"} icon={<Minus />} shortcutKey={7} onClick={() => setSelectedTool("line")} />
      <IconButton theme={theme} activated={selectedTool === "pencil"} icon={<Pencil />} shortcutKey={8} onClick={() => setSelectedTool("pencil")} />
      <IconButton theme={theme} activated={selectedTool === "text"} icon={<Type />} shortcutKey={9} onClick={() => setSelectedTool("text")} />
      <IconButton theme={theme} activated={selectedTool === "eraser"} icon={<Eraser />} shortcutKey={10} onClick={() => setSelectedTool("eraser")} />
    </div>
  );
}