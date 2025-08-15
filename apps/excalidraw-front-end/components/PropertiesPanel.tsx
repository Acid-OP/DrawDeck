'use client';

import React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { ColorSwatch } from './panel/ColorSwatch';
import { StyleButton } from './panel/StyleButton';
import { PropertySection } from './panel/PropertySection';
import { StrokePattern, StrokeWidthPattern } from './panel/StrokePatterns';
import { FillPattern } from './panel/FillPatterns';
import { useTheme } from '@/context/ThemeContext';

export interface ExcalidrawPropertiesPanelProps {
  strokeSelectedIndex?: number;
  backgroundSelectedIndex?: number;
  strokeWidthSelectedIndex?: number;
  strokeStyleSelectedIndex?: number;
  fillSelectedIndex?: number;
  onStrokeColorSelect?: (index: number) => void;
  onBackgroundColorSelect?: (index: number) => void;
  onStrokeWidthSelect?: (index: number) => void;
  onStrokeStyleSelect?: (index: number) => void;
  onFillStyleSelect?: (index: number) => void;
  className?: string;
  compact?: boolean;
}

export const ExcalidrawPropertiesPanel: React.FC<ExcalidrawPropertiesPanelProps> = ({
  strokeSelectedIndex = 0,
  backgroundSelectedIndex = 0,
  strokeWidthSelectedIndex = 0,
  strokeStyleSelectedIndex = 0,
  fillSelectedIndex = 0,
  onStrokeColorSelect,
  onBackgroundColorSelect,
  onStrokeWidthSelect,
  onStrokeStyleSelect,
  onFillStyleSelect,
  className,
  compact = false,
}) => {
  const {theme} = useTheme();
  const strokeColors = [
    { color: theme === 'light' ? '#1e1e1e' : '#ffffff', name: 'Default' },
    { color: '#e03131', name: 'Red' },
    { color: '#2f9e44', name: 'Green' },
    { color: '#1971c2', name: 'Blue' },
    { color: '#f08c00', name: 'Orange' },
  ];

  const backgroundColors = [
    { color: 'transparent', name: 'Transparent', isTransparent: true },
    { color: '#ffc9c9', name: 'Light Red' },
    { color: '#b2f2bb', name: 'Light Green' },
    { color: '#a5d8ff', name: 'Light Blue' },
    { color: '#ffec99', name: 'Light Yellow' },
  ];

  const strokeWidths = [
    { type: 'thin' as const, name: 'Thin' },
    { type: 'medium' as const, name: 'Medium' },
    { type: 'thick' as const, name: 'Thick' },
  ];

  const strokeStyles = [
    { type: 'solid' as const, name: 'Solid' },
    { type: 'dashed' as const, name: 'Dashed' },
    { type: 'dotted' as const, name: 'Dotted' },
  ];

  const fillStyles = [
    { type: 'hachure' as const, name: 'Hachure' },
    { type: 'cross-hatch' as const, name: 'Cross-hatch' },
    { type: 'dots' as const, name: 'Dots' },
    { type: 'solid' as const, name: 'Solid' },
  ];

  return (
    <div
      className={cn(
        'rounded-lg p-3 shadow-lg backdrop-blur-sm transition-colors duration-300 min-h-[320px]',
        theme === 'light'
          ? 'bg-white text-black border border-gray-300'
          : 'bg-[#232329] text-white border border-[#333]',
        compact ? 'w-44' : 'w-50',
        className
      )}
    >
      {/* Stroke Color */}
      <PropertySection label="Stroke" compact={compact}>
        <div className="flex items-center gap-2 flex-wrap">
          {strokeColors.map((colorData, index) => (
            <React.Fragment key={index}>
              <ColorSwatch
                color={colorData.color}
                selected={strokeSelectedIndex === index}
                onClick={() => onStrokeColorSelect?.(index)}
                title={colorData.name}
                size="md"
              />
              {/* {index === 4 && (
                <SidebarSeparator
                  theme={theme}
                  orientation="vertical"
                  length="h-5"
                  className="mx-1"
                />
              )} */}
            </React.Fragment>
          ))}
          {/* <StyleButton className="ml-1 cursor-pointer" title="More colors..." size="md" theme={theme}>
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400" />
          </StyleButton> */}
        </div>
      </PropertySection>

      {/* Background */}
      <PropertySection label="Background" compact={compact}>
        <div className="flex items-center gap-2 flex-wrap">
          {backgroundColors.map((colorData, index) => (
            <React.Fragment key={index}>
              <ColorSwatch
                color={colorData.color}
                selected={backgroundSelectedIndex === index}
                onClick={() => onBackgroundColorSelect?.(index)}
                title={colorData.name}
                size="md"
                isTransparent={colorData.isTransparent}
              />
              {/* {index === 4 && (
                <SidebarSeparator
                  theme={theme}
                  orientation="vertical"
                  length="h-5"
                  className="mx-1"
                />
              )} */}
            </React.Fragment>
          ))}
          {/* <StyleButton className="ml-1 cursor-pointer" title="More colors..." size="md" theme={theme}>
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-green-400" />
          </StyleButton> */}
        </div>
      </PropertySection>

      {/* Stroke Width */}
      <PropertySection label="Stroke Width" compact={compact}>
        <div className="flex items-center gap-2">
          {strokeWidths.map((widthData, index) => (
            <StyleButton
              key={index}
              selected={strokeWidthSelectedIndex === index}
              onClick={() => onStrokeWidthSelect?.(index)}
              title={widthData.name}
              size="lg"
            >
              <StrokeWidthPattern width={widthData.type} color="currentColor" />
            </StyleButton>
          ))}
        </div>
      </PropertySection>

      {/* Stroke Style */}
      <PropertySection label="Stroke Style" compact={compact}>
        <div className="flex items-center gap-2">
          {strokeStyles.map((styleData, index) => (
            <StyleButton
              key={index}
              selected={strokeStyleSelectedIndex === index}
              onClick={() => onStrokeStyleSelect?.(index)}
              title={styleData.name}
              size="lg"
            >
              <StrokePattern type={styleData.type} color="currentColor" />
            </StyleButton>
          ))}
        </div>
      </PropertySection>

      {/* Fill Style */}
      <PropertySection label="Fill Style" compact={compact}>
        <div className="flex items-center gap-2">
          {fillStyles.map((fillData, index) => (
            <StyleButton
              key={index}
              selected={fillSelectedIndex === index}
              onClick={() => onFillStyleSelect?.(index)}
              title={fillData.name}
              size="lg"
            >
              <FillPattern type={fillData.type} color="currentColor" size={10} />
            </StyleButton>
          ))}
        </div>
      </PropertySection>
    </div>
  );
};
