// PropertySection Component (resized)
'use client';
import React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface PropertySectionProps {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
  theme: 'light' | 'dark';
}

export const PropertySection: React.FC<PropertySectionProps> = ({ label, children, compact , theme }) => {
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
