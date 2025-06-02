import { Circle, Diamond, Eraser, Hand, LetterText, Minus, MousePointer, MoveRight, Pencil,  Square } from "lucide-react";
import { IconButton } from "./IconButton";
import { Tool } from "./Canvas";

export function TopBar({selectedTool,setSelectedTool,}:{selectedTool: Tool;setSelectedTool: (s: Tool) => void;}) {
  return (
    <div className="flex gap-1 bg-[#232329] rounded-lg cursor-pointer mt-1">
      <IconButton activated={selectedTool === "hand"} icon={<Hand/>} onClick={() => setSelectedTool("hand")} />
      <IconButton activated={selectedTool === "select"} icon={<MousePointer />} onClick={() => setSelectedTool("select")} />
      <IconButton activated={selectedTool === "rect"} icon={<Square/>} onClick={() => setSelectedTool("rect")} />
      <IconButton activated={selectedTool === "diamond"} icon={<Diamond/>} onClick={() => setSelectedTool("diamond")} />
      <IconButton activated={selectedTool === "circle"} icon={<Circle />} onClick={() => setSelectedTool("circle")} />
      <IconButton activated={selectedTool === "arrow"} icon={<MoveRight/>} onClick={() => setSelectedTool("arrow")} />
      <IconButton activated={selectedTool === "line"} icon={<Minus/>} onClick={() => setSelectedTool("line")} />
      <IconButton activated={selectedTool === "pencil"} icon={<Pencil/>} onClick={() => setSelectedTool("pencil")} />
      <IconButton activated={selectedTool === "text"} icon={<LetterText/>} onClick={() => setSelectedTool("text")} />
      <IconButton activated={selectedTool === "eraser"} icon={<Eraser/>} onClick={() => setSelectedTool("eraser")} />
    </div>
  );
}
