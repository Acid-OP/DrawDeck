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
}) => {
  const primaryTextColor =
    theme === 'dark' ? '#a8a5ff' : '#6965db';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
        variant === 'primary' 
          ? 'hover:bg-[#31303b]'
          : theme === 'dark'
            ? 'hover:bg-[#31303b] text-gray-300 hover:text-white'
            : 'hover:bg-[#f1f0ff] text-gray-700 hover:text-gray-900'
      }`}
    >
      <div
        className="text-lg"
        style={{ color: variant === 'primary' ? primaryTextColor : undefined }}
      >
        {icon}
      </div>
      <span
        className="font-medium"
        style={{ color: variant === 'primary' ? primaryTextColor : undefined }}
      >
        {label}
      </span>
    </button>
  );
};
