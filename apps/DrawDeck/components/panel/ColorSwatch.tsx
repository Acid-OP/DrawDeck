// ColorSwatch Component (resized)
import React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { useTheme } from '@/context/ThemeContext';

interface ColorSwatchProps {
  color: string;
  selected?: boolean;
  onClick?: () => void;
  title?: string;
  size?: 'sm' | 'md';
  isTransparent?: boolean;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  selected = false,
  onClick,
  title,
  size = 'md',
  isTransparent = false,
}) => {
  const {theme} = useTheme()
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6'
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-sm transition-all hover:scale-105 focus:outline-none cursor-pointer',
        selected && (theme === 'dark' ? 'border border-[#a8a5ff]' : 'border border-[#5050ff]'),
        sizeClasses[size],
        'flex items-center justify-center',
      )}
      style={{
        backgroundColor: isTransparent ? '#00000000' : color
      }}
    >
      {isTransparent && (
        <div className={cn(
          'w-3 h-3 border border-dashed',
          theme === 'dark' ? 'border-white' : 'border-black'
        )} />
      )}
    </button>
  );
};


