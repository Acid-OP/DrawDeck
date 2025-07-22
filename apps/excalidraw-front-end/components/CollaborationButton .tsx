import React, { useState } from 'react';
import { Users } from 'lucide-react';

interface LiveCollaborationButtonProps {
  onClick?: () => void;
  className?: string;
}

const LiveCollaborationButton: React.FC<LiveCollaborationButtonProps> = ({ 
  onClick, 
  className = '' 
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);

  return (
    <button
      className={`
        flex items-center justify-start gap-2 px-5 py-4 w-full cursor-pointer rounded-lg
        font-medium text-sm
        transition-all duration-200 ease-in-out
        shadow-sm hover:shadow-md
        transform hover:-translate-y-0.5
        ${isHovered ? 'bg-[#232329]' : 'bg-[#121212]'}
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