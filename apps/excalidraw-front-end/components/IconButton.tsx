import { LucideProps } from "lucide-react";
import { ReactElement } from "react";
import React from "react";

interface IconButtonProps {
  icon: ReactElement<LucideProps>;
  onClick: () => void;
  activated: boolean;
}

export function IconButton({ icon, onClick, activated }: IconButtonProps) {
  const styledIcon = {
    ...icon.props,
    size: icon.props.size ?? 18,
    color: "#e3e3e8",
  };

  return (
    <div
      className={`m-2 pointer rounded-sm p-3 hover:bg-gray flex items-center justify-center relative ${
        activated ? "bg-[#403e6a]" : ""
      }`}
      onClick={onClick}
    >
      {React.cloneElement(icon, styledIcon)}
      <div className="absolute bottom-0 right-1 text-[#e0dfff] text-sm mt-1 font-sans">
        1
      </div>
    </div>
  );
}
