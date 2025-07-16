'use client';

import React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { ColorSwatch } from './panel/ColorSwatch';
import { StyleButton } from './panel/StyleButton';
import { PropertySection } from './panel/PropertySection';
import { StrokePattern, StrokeWidthPattern } from './panel/StrokePatterns';
import { FillPattern } from './panel/FillPatterns';
import { SidebarSeparator } from './sidebar/SidebarSeparator';
import { ThemeToggle } from './sidebar/ThemeToggle';

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
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
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
  onThemeToggle,
  theme,
  compact = false,
}) => {
  const strokeColors = [
    { color: '#1e1e1e', name: 'Black' },
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
        'rounded-lg p-4 shadow-lg backdrop-blur-sm transition-colors duration-300',
        theme === 'light'
          ? 'bg-white text-black border border-gray-300'
          : 'bg-[#232329] text-white border border-[#333]',
        compact ? 'w-56' : 'w-68',
        className
      )}
    >
      {/* Stroke Color */}
      <PropertySection label="Stroke" compact={compact} theme={theme}>
        <div className="flex items-center gap-1.5">
          {strokeColors.map((colorData, index) => (
            <React.Fragment key={index}>
              <ColorSwatch
                color={colorData.color}
                selected={strokeSelectedIndex === index}
                onClick={() => onStrokeColorSelect?.(index)}
                title={colorData.name}
                size="md"
                theme = {theme}
              />
              {index === 4 && (
                <SidebarSeparator
                  theme={theme}
                  orientation="vertical"
                  length="h-6"
                  className="mx-1"
                />
              )}
            </React.Fragment>
          ))}
          <StyleButton className="ml-1 cursor-pointer" title="More colors..." size="md" theme={theme}>
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400" />
          </StyleButton>
        </div>
      </PropertySection>

      {/* Background */}
      <PropertySection label="Background" compact={compact} theme={theme}>
        <div className="flex items-center gap-1.5">
          {backgroundColors.map((colorData, index) => (
            <React.Fragment key={index}>
              <ColorSwatch
                color={colorData.color}
                selected={backgroundSelectedIndex === index}
                onClick={() => onBackgroundColorSelect?.(index)}
                title={colorData.name}
                size="md"
                isTransparent={colorData.isTransparent}
                theme={theme}
              />
              {index === 4 && (
                <SidebarSeparator
                  theme={theme}
                  orientation="vertical"
                  length="h-6"
                  className="mx-1"
                />
              )}
            </React.Fragment>
          ))}
          <StyleButton className="ml-1 cursor-pointer" title="More colors..." size="md" theme={theme}>
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-green-400" />
          </StyleButton>
        </div>
      </PropertySection>

      {/* Stroke Width */}
      <PropertySection label="Stroke Width" compact={compact} theme={theme}>
        <div className="flex items-center gap-1.5">
          {strokeWidths.map((widthData, index) => (
            <StyleButton
              key={index}
              selected={strokeWidthSelectedIndex === index}
              onClick={() => onStrokeWidthSelect?.(index)}
              title={widthData.name}
              size="lg"
              theme={theme}
            >
              <StrokeWidthPattern width={widthData.type} color="currentColor" />
            </StyleButton>
          ))}
        </div>
      </PropertySection>

      {/* Stroke Style */}
      <PropertySection label="Stroke Style" compact={compact} theme={theme}>
        <div className="flex items-center gap-1.5">
          {strokeStyles.map((styleData, index) => (
            <StyleButton
              key={index}
              selected={strokeStyleSelectedIndex === index}
              onClick={() => onStrokeStyleSelect?.(index)}
              title={styleData.name}
              size="lg"
              theme={theme}
            >
              <StrokePattern type={styleData.type} color="currentColor" />
            </StyleButton>
          ))}
        </div>
      </PropertySection>

      {/* Fill Style */}
      <PropertySection label="Fill Style" compact={compact} theme={theme}>
        <div className="flex items-center gap-1.5">
          {fillStyles.map((fillData, index) => (
            <StyleButton
              key={index}
              selected={fillSelectedIndex === index}
              onClick={() => onFillStyleSelect?.(index)}
              title={fillData.name}
              size="lg"
              theme={theme}
            >
              <FillPattern type={fillData.type} color="currentColor" size={14} />
            </StyleButton>
          ))}
        </div>
      </PropertySection>
    </div>
  );
};
