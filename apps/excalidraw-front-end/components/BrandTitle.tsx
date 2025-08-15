import React from 'react';
import BrandIcon from './brandicon';
import { useTheme } from '@/context/ThemeContext';

interface BrandTitleProps {
  className?: string;
}

const BrandTitle: React.FC<BrandTitleProps> = ({ className = '' }) => {
  const { theme } = useTheme();

  const textColor =
    theme === "dark"
      ? 'text-[#e2dfff]'
      : 'text-[#190064]';

  return (
    <div className={`flex justify-center items-center gap-4 m-4 ${className}`}>
      <BrandIcon size={40} strokeWidth={2}/>
      <h1 className={`excalifont text-4xl font-black ${textColor}`}>
        DRAWDECK
      </h1>
    </div>
  );
};

export default BrandTitle;
