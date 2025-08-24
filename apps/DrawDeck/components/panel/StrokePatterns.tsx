export const StrokeWidthPattern = ({ width, color }: { width: 'thin' | 'medium' | 'thick', color: string }) => {
  const strokeMap = {
    thin: 1,
    medium: 2,
    thick: 3
  };
  return (
    <svg width="16" height="8">
      <line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth={strokeMap[width]} />
    </svg>
  );
};

export const StrokePattern = ({ type, color }: { type: 'solid' | 'dashed' | 'dotted', color: string }) => {
  const dashArray = type === 'solid' ? '' : type === 'dashed' ? '4,4' : '1,4';
  return (
    <svg width="16" height="8">
      <line x1="0" y1="4" x2="16" y2="4" stroke={color} strokeWidth={2} strokeDasharray={dashArray} />
    </svg>
  );
};

