import React from 'react';

interface SocialButtonProps {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
  theme: 'light' | 'dark';
  onClick?: () => void;
}

export const SocialButton: React.FC<SocialButtonProps> = ({ 
  icon, 
  label, 
  highlight,
  theme,
  onClick
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-2.5 rounded-md transition-all duration-200 cursor-pointer  ${
      highlight
        ? `${theme === 'dark' 
            ? 'bg-[#ffe498] border border-[#ffe498]  shadow-lg text-black' 
            : 'bg-orange-50 border border-orange-200 shadow-lg shadow-orange-200/30 hover:bg-orange-100 text-orange-600'
          }`
        : theme === 'dark'
          ? 'hover:bg-[#31303b] text-[#babac0] hover:text-white'
          : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
    }`}
  >
    <div className="text-lg">{icon}</div>
    <span className="font-medium">{label}</span>
  </button>
);
