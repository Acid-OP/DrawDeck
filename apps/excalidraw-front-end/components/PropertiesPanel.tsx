import React from 'react';
import { Minus, MoreHorizontal } from 'lucide-react';

interface ColorSwatchProps {
  color: string;
  selected?: boolean;
  onClick?: () => void;
  title?: string;
  large?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, selected = false, onClick, title, large = false, icon, className = '' }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-7 h-7
        rounded-sm transition-all duration-200 hover:scale-110
        ${selected ? 'ring-2 ring-ring shadow-sm' : ''}
        hover:ring-2 hover:ring-ring focus:outline-none focus:ring-2 focus:ring-ring
        flex items-center justify-center cursor-pointer
        text-xs
        ${className}
      `}
      style={{ backgroundColor: color }}
      aria-label={`Select ${title || color}`}
    >
      {icon}
    </button>
  );
};

interface StrokeControlProps {
  selected?: boolean;
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const StrokeControl: React.FC<StrokeControlProps> = ({ selected = false, onClick, title, children, className = '' }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-9 h-9 rounded-sm transition-all duration-200 hover:scale-110 flex items-center justify-center cursor-pointer
        ${selected ? 'bg-[#403e6a]' : 'bg-[#2e2d39]'}
        hover:ring-2 hover:ring-stroke-control-selected focus:outline-none focus:ring-2 focus:ring-stroke-control-selected
        text-xs
        ${className}
      `}
    >
      {children}
    </button>
  );
};

interface SectionProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

const Section: React.FC<SectionProps> = ({ label, children, className = '' }) => (
  <div className={`space-y-2 pt-4 ${className}`}>
    <label className="text-sm font-medium text-[#d3d3d3] select-none block pb-1">{label}</label>
    {children}
  </div>
);

const FillStyleSection: React.FC<{
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}> = ({ selectedIndex, onSelect }) => {
  const fillIcons = ['Hachure', 'Cross Hatch', 'Dots'];
  return (
    <Section label="Fill">
      <div className="flex gap-1.5 pb-6">
        {fillIcons.map((name, index) => (
          <StrokeControl
            key={index}
            selected={selectedIndex === index}
            onClick={() => onSelect?.(index)}
            title={name}
          >
            <div className="w-5 h-5 bg-white text-[10px] text-black rounded-sm flex items-center justify-center">
              {name[0]}
            </div>
          </StrokeControl>
        ))}
      </div>
    </Section>
  );
};

export interface PropertiesPanelProps {
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
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  strokeSelectedIndex = 0,
  backgroundSelectedIndex,
  strokeWidthSelectedIndex = 0,
  strokeStyleSelectedIndex = 0,
  fillSelectedIndex = 0,
  onStrokeColorSelect,
  onBackgroundColorSelect,
  onStrokeWidthSelect,
  onStrokeStyleSelect,
  onFillStyleSelect
}) => {
  const strokeColors = ['#1e1e1e', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#ffffff'];
  const backgroundColors = ['transparent', '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99', 'transparent'];

  const strokeWidths = [
    <Minus className="w-4 h-4 text-white" strokeWidth={1} />, // thin
    <Minus className="w-4 h-4 text-white" strokeWidth={3} />, // medium
    <Minus className="w-4 h-4 text-white" strokeWidth={5} />  // bold
  ];

  const strokeStyles = [
    <Minus className="w-4 h-4 text-white" strokeWidth={2} />, // solid
    <MoreHorizontal className="w-4 h-4 text-white" strokeWidth={3} />, // dashed
    <div className="flex gap-0.5 overflow-hidden w-5 h-5 items-center justify-center">
      {[...Array(7)].map((_, i) => (
        <div key={i} className="w-[2px] h-[2px] bg-white rounded-full" />
      ))}
    </div>
  ];

  return (
    <div className="w-60 bg-[#232329] rounded-lg shadow-sm px-2">
      <Section label="Stroke">
        <div className="flex items-center">
          <div className="flex gap-1.5">
            {strokeColors.slice(0, 5).map((color, index) => (
              <ColorSwatch
                key={index}
                color={color}
                selected={strokeSelectedIndex === index}
                onClick={() => onStrokeColorSelect?.(index)}
                title={color}
              />
            ))}
          </div>
          <div className="w-4" />
          <ColorSwatch
            color={strokeColors[5]}
            selected={strokeSelectedIndex === 5}
            onClick={() => onStrokeColorSelect?.(5)}
            title={strokeColors[5]}
          />
        </div>
      </Section>

      <Section label="Background">
        <div className="flex items-center">
          <div className="flex gap-1.5">
            {backgroundColors.slice(0, 5).map((color, index) => (
              <ColorSwatch
                key={index}
                color={color === 'transparent' ? 'white' : color}
                icon={color === 'transparent' ? <div className="w-2.5 h-2.5 border border-dashed border-black" /> : undefined}
                selected={backgroundSelectedIndex === index}
                onClick={() => onBackgroundColorSelect?.(index)}
                title={color}
              />
            ))}
          </div>
          <div className="w-4" />
          <ColorSwatch
            color={backgroundColors[5] === 'transparent' ? 'white' : backgroundColors[5]}
            icon={<div className="w-2.5 h-2.5 border border-dashed border-black" />}
            selected={backgroundSelectedIndex === 5}
            onClick={() => onBackgroundColorSelect?.(5)}
            title={backgroundColors[5]}
          />
        </div>
      </Section>

      <Section label="Stroke Width">
        <div className="flex gap-1.5">
          {strokeWidths.map((icon, index) => (
            <StrokeControl
              key={index}
              selected={strokeWidthSelectedIndex === index}
              onClick={() => onStrokeWidthSelect?.(index)}
              title={['Thin', 'Bold', 'Extra Bold'][index]}
            >
              {icon}
            </StrokeControl>
          ))}
        </div>
      </Section>

      <Section label="Stroke Style">
        <div className="flex gap-1.5">
          {strokeStyles.map((style, index) => (
            <StrokeControl
              key={index}
              selected={strokeStyleSelectedIndex === index}
              onClick={() => onStrokeStyleSelect?.(index)}
              title={['Solid', 'Dashed', 'Dotted'][index]}
            >
              {style}
            </StrokeControl>
          ))}
        </div>
      </Section>

      <FillStyleSection
        selectedIndex={fillSelectedIndex}
        onSelect={onFillStyleSelect}
      />
    </div>
  );
};
