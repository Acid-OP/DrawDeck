"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

interface SidebarSeparatorProps {
  orientation?: "horizontal" | "vertical";
  length?: string;
  className?: string;
}

export const SidebarSeparator: React.FC<SidebarSeparatorProps> = ({
  orientation = "horizontal",
  length = "h-px",
  className = "",
}) => {
  const { theme } = useTheme();
  const isVertical = orientation === "vertical";

  const bgClass =
    theme === "dark"
      ? isVertical
        ? "bg-[rgba(255,255,255,0.12)]"
        : "bg-[rgba(255,255,255,0.08)]"
      : isVertical
      ? "bg-[rgba(0,0,0,0.12)]"
      : "bg-[rgba(0,0,0,0.06)]";

  const base = isVertical ? `w-px ${length}` : `h-px w-full`;

  return <div className={`${base} ${bgClass} ${className}`} />;
};
