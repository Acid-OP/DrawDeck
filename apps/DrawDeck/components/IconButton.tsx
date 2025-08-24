import { useTheme } from "@/context/ThemeContext";
import { LucideProps } from "lucide-react";
import { ReactElement } from "react";
import React from "react";

interface IconButtonProps {
  icon: ReactElement<LucideProps>;
  onClick: () => void;
  activated: boolean;
  shortcutKey: number;
  isMobile?: boolean;
  allowFillOnActive?: boolean; // 👈 new
}

export function IconButton({
  icon,
  onClick,
  activated,
  shortcutKey,
  isMobile = false,
  allowFillOnActive = true, // 👈 default true
}: IconButtonProps) {
  const { theme } = useTheme();
  const isActiveLight = activated && theme === "light" && allowFillOnActive; // 👈 only if allowed

  const styledIcon: Partial<LucideProps> = {
    size: isMobile ? 14 : (icon.props.size ?? 16),
    color: activated
      ? theme === "light"
        ? "#000000"
        : "#ffffff"
      : theme === "light"
        ? "#666666"
        : "#e3e3e8",
    fill: isActiveLight ? "#030064" : "none", // 👈 fill only if allowed
  };

  const bgColor =
    activated && theme === "light"
      ? "#e0dfff"
      : activated && theme === "dark"
      ? "#403e6a"
      : "transparent";

  const hoverBg = theme === "light" ? "hover:bg-gray-100" : "hover:bg-white/5";
  const shortcutColor = theme === "light" ? "#4a4a4d" : "#ffffff";

  const buttonClasses = isMobile 
    ? "m-0.5 p-1.5 rounded-md flex items-center justify-center relative cursor-pointer transition-all"
    : "m-1 p-2 rounded-md flex items-center justify-center relative cursor-pointer transition-all";

  const shortcutClasses = isMobile
    ? "absolute bottom-[-1px] right-[2px] text-[7px] font-semibold pointer-events-none opacity-60"
    : "absolute bottom-[-2px] right-[4px] text-[9px] font-semibold pointer-events-none opacity-60";

  return (
    <div
      className={`${buttonClasses} ${hoverBg}`}
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
    >
      {React.cloneElement(icon, styledIcon)}
      <div
        className={shortcutClasses}
        style={{ color: shortcutColor }}
      >
        {shortcutKey}
      </div>
    </div>
  );
}