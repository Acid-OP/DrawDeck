'use client';

import React from 'react';
import { cn } from '@repo/ui/lib/utils';

export interface StyleButtonProps {
  selected?: boolean;
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  theme: 'light' | 'dark'; // added
}

export const StyleButton: React.FC<StyleButtonProps> = ({
  selected = false,
  onClick,
  title,
  children,
  size = 'md',
  className,
  theme,
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
        'hover:scale-105 focus:outline-none active:scale-95 cursor-pointer',
        sizeClasses[size],
        theme === 'dark'
          ? selected
            ? 'bg-[#403e6a] text-[#e3e3e8] shadow-sm'
            : 'bg-[#2e2d39] text-[#e3e3e8]'
          : selected
          ? 'bg-[#e0dfff] text-[#030064]'
          : 'bg-[#f2f2f7] text-[#030064]',
        className
      )}
    >
      {children}
    </button>
  );
};
