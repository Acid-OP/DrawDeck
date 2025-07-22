import React from 'react';
import BrandIcon from './brandicon';


interface BrandTitleProps {
 className?: string;
}

const BrandTitle: React.FC<BrandTitleProps> = ({
 className = ''
}) => {
 return (
   <div className={`flex justify-center items-center gap-4 ${className}`}>
     <BrandIcon size={50} strokeWidth={2} />
     <h1 className="virgil text-5xl font-bold text-[#d3d1ee] p-4">
       COLLABYDRAW
     </h1>
   </div>
 );
};

export default BrandTitle;