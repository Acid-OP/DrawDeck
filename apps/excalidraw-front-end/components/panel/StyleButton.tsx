import React from 'react';
import { cn } from '@repo/ui/lib/utils';

export interface StyleButtonProps {
  selected?: boolean;
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StyleButton: React.FC<StyleButtonProps> = ({
  selected = false,
  onClick,
  title,
  children,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'relative rounded-sm transition-all duration-150 flex items-center justify-center group',
        'hover:scale-105 focus:outline-none active:scale-95 cursor-pointer text-[#e3e3e8]',
        sizeClasses[size],
        selected
          ? 'shadow-sm bg-[#403e6a]'
          : 'bg-[#2e2d39]',
        className
      )}
    >
      {children}
    </button>
  );
};
