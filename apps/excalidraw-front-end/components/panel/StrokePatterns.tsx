import React from 'react';

export const StrokeWidthPattern = ({ width, color }: { width: 'thin' | 'medium' | 'thick', color: string }) => {
  const strokeMap = {
    thin: 1,
    medium: 3,
    thick: 5
  };
  return (
    <svg width="20" height="10">
      <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth={strokeMap[width]} />
    </svg>
  );
};

export const StrokePattern = ({ type, color }: { type: 'solid' | 'dashed' | 'dotted', color: string }) => {
  const dashArray = type === 'solid' ? '' : type === 'dashed' ? '5,5' : '1,5';
  return (
    <svg width="20" height="10">
      <line x1="0" y1="5" x2="20" y2="5" stroke={color} strokeWidth={2} strokeDasharray={dashArray} />
    </svg>
  );
};
