import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface SignupButtonProps {
  onClick?: () => void;
  className?: string;
}

const SignupButton: React.FC<SignupButtonProps> = ({
  onClick,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const { theme } = useTheme();

  const bgColor =
    theme === 'dark'
      ? (isHovered ? 'bg-[#232329]' : 'bg-[#121212]')
      : (isHovered ? 'bg-[#f1f0ff]' : 'bg-white');

  return (
    <button
      className={`
        flex items-center justify-start gap-2
        px-3 py-2
        w-full cursor-pointer rounded-md
        font-medium text-sm
        transition-colors duration-200 ease-in-out
        ${bgColor}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <UserPlus size={14} strokeWidth={2} className="text-[#7a7a7a]" />
      <span className={`${isHovered ? 'text-[#b5b5b6]' : 'text-[#7a7a7a]'} text-sm`}>
        Sign up
      </span>
    </button>
  );
};

export default SignupButton;