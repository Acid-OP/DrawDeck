import React from 'react';

export const FillPattern = ({ type, color, size = 14 }: { type: 'hachure' | 'cross-hatch' | 'dots' | 'solid', color: string, size?: number }) => {
  const patterns = {
    hachure: '////',
    'cross-hatch': 'xxxx',
    dots: '•••',
    solid: '■'
  };
  return (
    <div
      style={{ color, fontSize: size }}
      className="flex items-center justify-center w-full h-full font-mono"
    >
      {patterns[type]}
    </div>
  );
};
