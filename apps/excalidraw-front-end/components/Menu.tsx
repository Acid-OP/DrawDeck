"use client";

import { useState, useRef, useEffect } from "react";
import { SidebarModal } from "./SidebarModal";
import { MenuIcon } from "lucide-react";

export function Menu() {
  const [activated, setActivated] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const menuRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setActivated((prev) => !prev);
    setClicked(true);
    setTimeout(() => setClicked(false), 300);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
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
          bg-[#232329] p-3 rounded-lg inline-block cursor-pointer hover:bg-[#363541] transition
          ${clicked ? "border-2 border-[#727198]" : "border-2 border-transparent"}
        `}
      >
        <MenuIcon size={20} className="text-white" />
      </div>

      {activated && (
        <div className="absolute left-0 mt-2 z-50">
          <SidebarModal
            isOpen={true}
            onClose={() => setActivated(false)}
            theme={theme}
            onThemeToggle={toggleTheme}
          />
        </div>
      )}
    </div>
  );
}
