import React from 'react';
import { cn } from '@repo/ui/lib/utils';

interface PropertySectionProps {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}

export const PropertySection: React.FC<PropertySectionProps> = ({ label, children, compact }) => {
  return (
    <div className={cn('mb-4')}>
      <label className={cn('block text-md font-light tracking-wide mb-3',
        'text-white dark:text-[#acacb1]'
      )}>
        {label}
      </label>
      {children}
    </div>
  );
};
