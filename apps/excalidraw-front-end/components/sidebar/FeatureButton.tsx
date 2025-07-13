
import React from 'react';

interface FeatureButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'primary';
  theme: 'light' | 'dark';
}

export const FeatureButton: React.FC<FeatureButtonProps> = ({ 
  icon, 
  label, 
  onClick, 
  variant = 'default',
  theme 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
      variant === 'primary' 
        ? 'text-[#a8a5ff] hover:bg-[#31303b]'
        : theme === 'dark'
          ? 'hover:bg-[#31303b] text-gray-300 hover:text-white'
          : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
    }`}
  >
    <div className={`text-lg ${variant === 'primary' ? 'text-[#a8a5ff]' : ''}`}>
      {icon}
    </div>
    <span className={`font-medium ${variant === 'primary' ? 'text-[#a8a5ff]' : ''}`}>
      {label}
    </span>
  </button>
);
