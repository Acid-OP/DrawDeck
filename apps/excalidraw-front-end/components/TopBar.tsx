import { Circle, Diamond, Eraser, Hand, LetterText, Minus, MousePointer, MoveRight, Pencil,  Square } from "lucide-react";
import { IconButton } from "./IconButton";
import { Tool } from "./Canvas";

export function TopBar({selectedTool,setSelectedTool,}:{selectedTool: Tool;setSelectedTool: (s: Tool) => void;}) {
  return (
    <div className="flex gap-1 bg-[#232329] rounded-lg cursor-pointer mt-1">
      <IconButton activated={selectedTool === "hand"} icon={<Hand/>}  shortcutKey = {1} onClick={() => setSelectedTool("hand")} />
      <IconButton activated={selectedTool === "select"} icon={<MousePointer />} shortcutKey = {2} onClick={() => setSelectedTool("select")} />
      <IconButton activated={selectedTool === "rect"} icon={<Square/>} shortcutKey = {3} onClick={() => setSelectedTool("rect")} />
      <IconButton activated={selectedTool === "diamond"} icon={<Diamond/>} shortcutKey = {4} onClick={() => setSelectedTool("diamond")} />
      <IconButton activated={selectedTool === "circle"} icon={<Circle />} shortcutKey = {5} onClick={() => setSelectedTool("circle")} />
      <IconButton activated={selectedTool === "arrow"} icon={<MoveRight/>} shortcutKey = {6} onClick={() => setSelectedTool("arrow")} />
      <IconButton activated={selectedTool === "line"} icon={<Minus/>} shortcutKey = {7} onClick={() => setSelectedTool("line")} />
      <IconButton activated={selectedTool === "pencil"} icon={<Pencil/>} shortcutKey = {8} onClick={() => setSelectedTool("pencil")} />
      <IconButton activated={selectedTool === "text"} icon={<LetterText/>} shortcutKey = {9} onClick={() => setSelectedTool("text")} />
      <IconButton activated={selectedTool === "eraser"} icon={<Eraser/>} shortcutKey = {10} onClick={() => setSelectedTool("eraser")} />
    </div>
  );
}
