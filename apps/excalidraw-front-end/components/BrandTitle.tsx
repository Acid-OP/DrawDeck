import React from 'react';
import BrandIcon from './brandicon';


interface BrandTitleProps {
 className?: string;
 theme : "light" | "dark";
}

const BrandTitle: React.FC<BrandTitleProps> = ({
 className = '',
 theme
}) => {
  const textColor = 
  theme === "dark" 
  ? 'text-[#e2dfff]'
  : 'text-[#190064]';
 return (
   <div className={`flex justify-center items-center gap-4 m-4 ${className}`}>
     <BrandIcon size={40} strokeWidth={2} theme={theme} />
     <h1 className={`excalifont text-4xl font-black ${textColor}`}>
       DRAWDECK
     </h1>
   </div>
 );
};

export default BrandTitle;