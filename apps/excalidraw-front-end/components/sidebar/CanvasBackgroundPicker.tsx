import React, { useState } from 'react';
import { SidebarSeparator } from './SidebarSeparator';
import { useTheme } from '@/context/ThemeContext';

interface CanvasBackgroundPickerProps {
  theme: 'light' | 'dark';
}

const backgroundColors = [
  '#ffffff',
  '#f8f9fa',
  '#f5faff',
  '#fffce8',
  '#fdf8f6',
  '#e6f4ea', 
];

export const CanvasBackgroundPicker: React.FC<CanvasBackgroundPickerProps> = () => {
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const { theme } = useTheme();
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const bgColor = theme === 'dark' ? '#232329' : '#ffffff';
  const textColor = theme === 'dark' ? '#bdbdc1' : '#6b7280';

  return (
    <div
      className="rounded-lg p-3 transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      <h2 className="text-md font-semibold mb-3" style={{ color: textColor }}>
        Canvas Background
      </h2>

      <div className="flex flex-nowrap items-center gap-2">
        {backgroundColors.slice(0, 5).map((color) => (
          <button
            key={color}
            onClick={() => handleColorSelect(color)}
            className={`w-8 h-8 rounded-md border-2 transition-all duration-200 cursor-pointer ${
              selectedColor === color
                ? 'border-blue-500 scale-110 shadow-md'
                : theme === 'dark'
                  ? 'border-gray-600 hover:border-gray-500'
                  : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}

        {/* Vertical Separator */}
        <SidebarSeparator
          orientation="vertical"
          length="h-6"
          className="mx-1"
        />

        {/* Sixth Color Box */}
        <button
          key={backgroundColors[5]}
          onClick={() => handleColorSelect(backgroundColors[5])}
          className={`w-8 h-8 rounded-md border-2 transition-all duration-200 cursor-pointer ${
            selectedColor === backgroundColors[5]
              ? 'border-blue-500 scale-110 shadow-md'
              : theme === 'dark'
                ? 'border-gray-600 hover:border-gray-500'
                : 'border-gray-300 hover:border-gray-400'
          }`}
          style={{ backgroundColor: backgroundColors[5] }}
        />
      </div>
    </div>
  );
};
