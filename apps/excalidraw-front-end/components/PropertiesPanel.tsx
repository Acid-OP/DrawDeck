import React from 'react';
import { Minus, MoreHorizontal } from 'lucide-react';

interface ColorSwatchProps {
  color: string;
  selected?: boolean;
  onClick?: () => void;
  title?: string;
  large?: boolean;
  icon?: React.ReactNode;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, selected = false, onClick, title, large = false, icon }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        ${large ? 'w-8 h-8' : 'w-6 h-6'}
        rounded-sm border-2 transition-all duration-200 hover:scale-110
        ${selected ? 'border-ring shadow-sm' : 'border-panel-border'}
        hover:border-ring focus:outline-none focus:border-ring
        flex items-center justify-center cursor-pointer
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
}

const StrokeControl: React.FC<StrokeControlProps> = ({ selected = false, onClick, title, children }) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        w-7 h-7 rounded-sm border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center cursor-pointer
        ${selected ? 'bg-stroke-control-selected border-stroke-control-selected' : 'bg-stroke-control border-stroke-control'}
        hover:border-stroke-control-selected focus:outline-none focus:border-stroke-control-selected
      `}
    >
      {children}
    </button>
  );
};

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-sm font-normal text-white select-none">{label}</label>
    {children}
  </div>
);

const FillStyleSection: React.FC<{
  selectedIndex?: number;
  onSelect?: (index: number) => void;
}> = ({ selectedIndex, onSelect }) => {
  const fillIcons = ['Hachure', 'Cross Hatch', 'Dots', 'Dashed', 'Zigzag', 'Solid'];
  return (
    <Section label="Fill">
      <div className="flex gap-1.5">
        {fillIcons.map((name, index) => (
          <StrokeControl
            key={index}
            selected={selectedIndex === index}
            onClick={() => onSelect?.(index)}
            title={name}
          >
            <div className="w-3.5 h-3.5 bg-white text-[10px] text-black rounded-sm flex items-center justify-center">
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
  const strokeColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFFFFF'];
  const backgroundColors = ['transparent', '#FFCCCC', '#CCFFCC', '#CCCCFF', '#FFFFCC', '#F0F0F0'];

  const strokeWidths = [
    <Minus className="w-3 h-3 text-white" strokeWidth={1} />,  // Thin
    <Minus className="w-3 h-3 text-white" strokeWidth={3} />,  // Bold
    <Minus className="w-3 h-3 text-white" strokeWidth={5} />   // Extra Bold
  ];

  const strokeStyles = [
    <Minus className="w-3 h-3 text-white" strokeWidth={2} />,  // Solid
    <MoreHorizontal className="w-3 h-3 text-white" strokeWidth={2} />, // Dashed
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-0.5 h-0.5 bg-white rounded-full" />
      ))}
    </div>
  ];

  return (
    <div className="w-60 bg-[#232329] border border-panel-border rounded-lg shadow-sm p-4 space-y-4">
      <Section label="Stroke">
        <div className="flex items-center gap-2">
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
          <div className="w-2" />
          <ColorSwatch
            color={strokeColors[5]}
            large
            selected={strokeSelectedIndex === 5}
            onClick={() => onStrokeColorSelect?.(5)}
            title={strokeColors[5]}
          />
        </div>
      </Section>

      <Section label="Background">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {backgroundColors.slice(0, 1).map((color, index) => (
              <ColorSwatch
                key={index}
                color={color === 'transparent' ? 'white' : color}
                icon={<div className="w-2.5 h-2.5 border border-dashed border-black" />}
                selected={backgroundSelectedIndex === index}
                onClick={() => onBackgroundColorSelect?.(index)}
                title="Transparent"
              />
            ))}
            {backgroundColors.slice(1, 5).map((color, index) => (
              <ColorSwatch
                key={index + 1}
                color={color}
                selected={backgroundSelectedIndex === index + 1}
                onClick={() => onBackgroundColorSelect?.(index + 1)}
                title={color}
              />
            ))}
          </div>
          <div className="w-2" />
          <ColorSwatch
            color={backgroundColors[5]}
            large
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
