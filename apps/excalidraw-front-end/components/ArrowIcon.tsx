import React from 'react';

interface ArrowIconProps {
    direction: 'up' | 'down' | 'left' | 'right';
    label: string;
}

export const ArrowIcon: React.FC<ArrowIconProps> = ({ direction, label }) => {
    const arrowStyles = {
        up: 'rotate-180',
        down: '',
        left: '-rotate-90',
        right: 'rotate-90',
    };

    return (
        <div className="relative w-6 h-6">
            <div className={`absolute top-0 left-1/2 transform ${arrowStyles[direction]} w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[15px] border-b-white`} />
            <span className="absolute text-sm text-white">{label}</span>
        </div>
    );
};
