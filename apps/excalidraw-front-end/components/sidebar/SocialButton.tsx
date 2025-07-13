
import React from 'react';

interface SocialButtonProps {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
  theme: 'light' | 'dark';
}

export const SocialButton: React.FC<SocialButtonProps> = ({ 
  icon, 
  label, 
  highlight,
  theme 
}) => (
  <button
    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer hover:bg-[#31303b] ${
      highlight
        ? `${theme === 'dark' 
            ? 'bg-orange-500/8 border border-orange-500/15 shadow-lg hover:bg-orange-500/12 text-orange-400' 
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
