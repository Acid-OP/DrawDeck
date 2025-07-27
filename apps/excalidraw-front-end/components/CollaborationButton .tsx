import React, { useState } from 'react';
import { Users } from 'lucide-react';

interface LiveCollaborationButtonProps {
  onClick?: () => void;
  className?: string;
  theme : "light" | "dark";
}

const LiveCollaborationButton: React.FC<LiveCollaborationButtonProps> = ({ 
  onClick, 
  className = '' ,
  theme
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
   const bgColor =
    theme === 'dark'
      ? (isHovered ? 'bg-[#232329]' : 'bg-[#121212]')
      : (isHovered ? 'bg-[#f1f0ff]' : 'bg-white');
  return (
    <button
      className={`
        flex items-center justify-start gap-2 px-5 py-4 w-full cursor-pointer rounded-lg
        font-medium text-sm
        transition-all duration-200 ease-in-out
        ${bgColor}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <Users size={16} strokeWidth={2} className="text-[#7a7a7a]" />
      <span className={`${isHovered ? 'text-[#b5b5b6]' : 'text-[#7a7a7a]'} text-lg`}>
        Live collaboration
      </span>
    </button>
  );
};

export default LiveCollaborationButton;