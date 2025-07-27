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
   <div className={`flex justify-center items-center gap-4 ${className}`}>
     <BrandIcon size={50} strokeWidth={2} theme={theme} />
     <h1 className={`virgil text-5xl font-bold ${textColor} p-4`}>
       COLLABYDRAW
     </h1>
   </div>
 );
};

export default BrandTitle;