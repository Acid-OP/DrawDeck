"use client";

import { useState, useRef, useEffect } from "react";
import { SidebarModal } from "./SidebarModal";
import { MenuIcon } from "lucide-react";

interface MenuProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function Menu({ theme, onThemeToggle }: MenuProps) {
  const [activated, setActivated] = useState(false);
  const [clicked, setClicked] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setActivated((prev) => !prev);
    setClicked(true);
    setTimeout(() => setClicked(false), 300);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActivated(false);
      }
    };

    if (activated) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activated]);

 return (
  <div className="relative inline-block" ref={menuRef}>
    <div
      onClick={handleClick}
      className={`
        p-3 rounded-lg inline-block cursor-pointer transition
        ${clicked ? "border-2 border-blue-500" : "border-2 border-transparent"}
        ${theme === "dark" ? "bg-[#232329] hover:bg-[#363541]" : "bg-[#ececf4] hover:bg-[#d6d6e2]"}
      `}
    >
      <MenuIcon size={20} className={theme === "dark" ? "text-white" : "text-black"} />
    </div>

    {activated && (
      <div className="absolute left-0 mt-2 z-50">
        <SidebarModal
          isOpen={true}
          onClose={() => setActivated(false)}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
      </div>
    )}
  </div>
);

}
