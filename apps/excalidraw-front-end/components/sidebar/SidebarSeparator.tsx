import React from 'react';

interface SidebarSeparatorProps {
  theme: 'light' | 'dark';
  orientation?: 'horizontal' | 'vertical';
  length?: string; // e.g., 'h-px' for horizontal, 'h-6' for vertical height
  className?: string;
}

export const SidebarSeparator: React.FC<SidebarSeparatorProps> = ({
  theme,
  orientation = 'horizontal',
  length = 'h-px',
  className = '',
}) => {
  const isVertical = orientation === 'vertical';

  const bgClass = theme === 'dark'
    ? isVertical
      ? 'bg-[rgba(255,255,255,0.12)]'
      : 'bg-[rgba(255,255,255,0.08)]'
    : isVertical
      ? 'bg-[rgba(0,0,0,0.12)]'
      : 'bg-[rgba(0,0,0,0.06)]';

  const base = isVertical
    ? `w-px ${length}`
    : `h-px w-full`;

  return <div className={`${base} ${bgClass} ${className}`} />;
};
