import React from 'react';

interface ToolbarIconProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}

const ToolbarIcon: React.FC<ToolbarIconProps> = ({
  size = 80,
  strokeWidth = 2,
  className = '',
  color = '#7a7a7a',
}) => {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      viewBox="0 0 38 78"
      width={size}
      height={size}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 77c14-2 31.833-11.973 35-24 3.167-12.016-6-35-9.5-43.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="m24.165 1.093-2.132 16.309 13.27-4.258-11.138-12.05Z"
        fill={color}
      />
      <path
        d="M24.165 1.093c-.522 3.953-1.037 7.916-2.132 16.309m2.131-16.309c-.835 6.424-1.68 12.854-2.13 16.308m0 0c3.51-1.125 7.013-2.243 13.27-4.257m-13.27 4.257c5.038-1.608 10.08-3.232 13.27-4.257m0 0c-3.595-3.892-7.197-7.777-11.14-12.05m11.14 12.05c-3.837-4.148-7.667-8.287-11.14-12.05"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
};

export default ToolbarIcon;
