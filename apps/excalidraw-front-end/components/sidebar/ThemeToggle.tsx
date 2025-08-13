import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/base/toggle-group';

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  isMobile?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onThemeChange, isMobile = false }) => {
  const isLight = theme === 'light';

  const getIconColor = (target: 'light' | 'dark' | 'system') => {
    if (theme === 'light') return 'black';
    if (theme === 'dark') return target === 'dark' ? 'black' : '#a8a5ff';
    return '#a8a5ff';
  };

  const bgColor = isLight ? '#ffffff' : '#232329';
  const toggleBg = isLight ? '#ffffff' : '#27272f';
  const borderColor = isLight ? '#e5e5e5' : '#27272f';

  return (
    <div
      className={`flex w-full items-center py-1 gap-5 rounded-lg transition-colors duration-300 ${
        isMobile ? 'justify-start pl-2' : 'justify-end pl-2'
      }`}
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="font-medium text-md transition-colors duration-300"
        style={{ color: isLight ? '#000000' : '#e0e0e0' }}
      >
        Theme
      </div>
      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(value) => {
          if (value === 'light' || value === 'dark' || value === 'system') {
            onThemeChange(value);
          }
        }}
        className="flex gap-2 rounded-md px-[4px] py-[3px] transition-all duration-300"
        style={{
          backgroundColor: toggleBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        <ToggleGroupItem
          value="light"
          className="h-10 w-15 flex items-center justify-center rounded-md transition-all cursor-pointer duration-300 hover:bg-background/40 data-[state=on]:bg-[#a8a5ff]"
          aria-label="Light theme"
        >
          <Sun size={15} color={getIconColor('light')} />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="dark"
          className="h-10 w-15 flex items-center justify-center rounded-md transition-all cursor-pointer duration-300 hover:bg-background/40 data-[state=on]:bg-[#a8a5ff]"
          aria-label="Dark theme"
        >
          <Moon size={15} color={getIconColor('dark')} />
        </ToggleGroupItem>

        {/* <ToggleGroupItem
          value="system"
          className="h-10 w-10 flex items-center justify-center rounded-md transition-all cursor-pointer duration-300 hover:bg-background/40 data-[state=on]:bg-[#a8a5ff]"
          aria-label="System theme"
        >
          <Monitor size={15} color={getIconColor('system')} />
        </ToggleGroupItem> */}
      </ToggleGroup>
    </div>
  );
};