import { LucideProps } from "lucide-react";
import { ReactElement } from "react";
import React from "react";

interface IconButtonProps {
  icon: ReactElement<LucideProps>;
  onClick: () => void;
  activated: boolean;
  shortcutKey: number;
  theme: "light" | "dark";
}

export function IconButton({
  icon,
  onClick,
  activated,
  shortcutKey,
  theme,
}: IconButtonProps) {
  const isActiveLight = activated && theme === "light";
  const styledIcon: Partial<LucideProps> = {
    size: icon.props.size ?? 16, 
    color: activated
      ? theme === "light"
        ? "#000000"
        : "#ffffff"
      : theme === "light"
        ? "#666666"
        : "#e3e3e8",
    fill: isActiveLight ? "#030064" : "none",
  };

  const bgColor =
    activated && theme === "light"
      ? "#e0dfff"
      : activated && theme === "dark"
        ? "#403e6a"
        : "transparent";
  const hoverBg = theme === "light"
    ? "hover:bg-gray-100"
    : "hover:bg-white/5";

  const shortcutColor = theme === "light"
    ? "#4a4a4d"
    : "#ffffff";

  return (
    <div
      className={`m-1 p-2 rounded-md flex items-center justify-center relative cursor-pointer transition-all ${hoverBg}`}
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
    >
      {React.cloneElement(icon, styledIcon)}
      <div
        className="absolute bottom-[-2px] right-[4px] text-[9px] font-semibold pointer-events-none opacity-60"
        style={{ color: shortcutColor }}
      >
        {shortcutKey}
      </div>
    </div>
  );
}