import React from 'react';
import { cn } from '@repo/ui/lib/utils';

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
  isTransparent = false
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8'
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'rounded-sm transition-all hover:scale-105 focus:outline-none',
        selected && 'border-2 border-[#a8a5ff]',
        sizeClasses[size],
        'flex items-center justify-center',
        
      )}
      style={{
        backgroundColor: isTransparent ? '#00000000' : color
      }}
    >
      {isTransparent && (
        <div className="w-3 h-3 border border-dashed border-black" />
      )}
    </button>
  );
};
