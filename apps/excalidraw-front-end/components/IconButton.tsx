import { LucideProps } from "lucide-react";
import { ReactElement } from "react";
import React from "react";

interface IconButtonProps {
  icon: ReactElement<LucideProps>;
  onClick: () => void;
  activated: boolean;
  shortcutKey: number; 
}

export function IconButton({ icon, onClick, activated , shortcutKey }: IconButtonProps) {
  const styledIcon = {
    ...icon.props,
    size: icon.props.size ?? 18,
    color: "#e3e3e8",
  };

  return (
    <div
      className={`m-2 pointer  p-3 rounded-lg hover:bg-white/5
 flex items-center justify-center relative  ${
        activated ? "bg-[#403e6a] rounded-lg" : ""
      }`}
      onClick={onClick}
    >
      {React.cloneElement(icon, styledIcon)}
        <div
    className="absolute bottom-[1px] right-[1px] text-[10px] text-white font-semibold pointer-events-none opacity-60 "
  >

        {shortcutKey}
      </div>
    </div>
  );
}
