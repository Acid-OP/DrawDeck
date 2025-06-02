"use client";
import { useState } from "react";
import { SidebarModal } from "./SidebarModal";
import { MenuIcon } from "lucide-react";

export function Menu() {
  const [activated, setActivated] = useState(false);
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setTimeout(() => setActivated((prev) => !prev) , 100)
    setClicked(true);
    setTimeout(() => setClicked(false), 300);
  };

  return (
    <div className="relative">
      <div
        onClick={handleClick}
        className={`
          bg-[#232329] p-3 rounded-lg inline-block cursor-pointer hover:bg-[#363541] transition
          ${clicked ? "border-2 border-[#727198]" : "border-2 border-transparent"}
        `}
      >
        <MenuIcon size={20} className="text-white" />
      </div>

      {activated && <SidebarModal />}
    </div>
  );
}
