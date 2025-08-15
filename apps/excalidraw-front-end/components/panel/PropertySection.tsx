'use client';
import React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { useTheme } from '@/context/ThemeContext';

interface PropertySectionProps {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}

export const PropertySection: React.FC<PropertySectionProps> = ({ label, children, compact }) => {
  const {theme} = useTheme();
  return (
    <div className={cn('mb-4')}>
      <label
        className={cn(
          'block text-sm font-light tracking-wide mb-2',
          theme === 'dark' ? 'text-[#acacb1]' : 'text-[#030064]'
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
};
