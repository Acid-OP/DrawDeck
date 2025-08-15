"use client";
import { useState, useRef, useEffect } from "react";
import { SidebarModal } from "./SidebarModal";
import { MenuIcon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext"; 

interface MenuProps {
  onClearCanvas: () => void;
  isCollabMode?: boolean;
  roomId?: string;
  encryptionKey?: string;
  roomType?: 'duo' | 'group';
  isMobile?: boolean; 
  onOpen?: () => void; 
  onClose?: () => void; 
}

export function Menu({
  onClearCanvas,
  isCollabMode = false,
  roomId,
  encryptionKey,
  roomType,
  isMobile = false,
  onOpen,
  onClose
}: MenuProps) {
  const { theme } = useTheme(); 
  const [activated, setActivated] = useState(false);
  const [clicked, setClicked] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setActivated((prev) => {
      const newState = !prev;

      if (newState) onOpen?.();
      else onClose?.();

      return newState;
    });
    setClicked(true);
    setTimeout(() => setClicked(false), 300);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActivated(false);
        onClose?.(); 
      }
    };

    if (activated) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activated, onClose]);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <div
        onClick={handleClick}
        className={`
          p-2 rounded-md inline-block cursor-pointer transition
          ${isMobile 
            ? "border border-black" 
            : (clicked ? "border-1 border-[#9b98e7]" : "")
          }
          ${theme === "dark" ? "bg-[#232329] hover:bg-[#363541]" : "bg-[#ececf4] hover:bg-[#d6d6e2]"}
        `}
      >
        <MenuIcon size={16} className={theme === "dark" ? "text-white" : "text-black"} />
      </div>

      {activated && (
        <div
          className={`
            absolute left-0 z-50
            ${isMobile ? "bottom-full mb-1" : "top-full mt-1"}
          `}
        > 
          <SidebarModal
            isOpen={true}
            onClose={() => {
              setActivated(false);
              onClose?.(); 
            }}
            onClearCanvas={onClearCanvas}
            isCollabMode={isCollabMode}
            roomId={roomId}
            encryptionKey={encryptionKey}
            roomType={roomType}
            isMobile={isMobile}
          />
        </div>
      )}
    </div>
  );
}