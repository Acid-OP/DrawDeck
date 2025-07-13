import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/base/toggle-group';

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system';
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onThemeChange }) => {
  const isLight = theme === 'light';
  const isDark = theme === 'dark';

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
      className="flex items-center justify-between px-2 py-1 rounded-lg transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      <span
        className="font-medium text-lg transition-colors duration-300"
        style={{ color: isLight ? '#000000' : '#e0e0e0' }}
      >
        Theme
      </span>

      <ToggleGroup
        type="single"
        value={theme}
        onValueChange={(value) => {
          if (value === 'light' || value === 'dark' || value === 'system') {
            onThemeChange(value);
          }
        }}
        className="flex gap-[6px] rounded-md px-1 py-[2px] transition-all duration-300"
        style={{
          backgroundColor: toggleBg,
          border: `1px solid ${borderColor}`,
        }}
      >
        <ToggleGroupItem
          value="light"
          className="h-10 w-10 flex items-center justify-center rounded-md transition-all cursor-pointer duration-300 hover:bg-background/40 data-[state=on]:bg-[#a8a5ff]"
          aria-label="Light theme"
        >
          <Sun size={24} color={getIconColor('light')} />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="dark"
          className="h-10 w-10 flex items-center justify-center rounded-md transition-all cursor-pointer duration-300 hover:bg-background/40 data-[state=on]:bg-[#a8a5ff]"
          aria-label="Dark theme"
        >
          <Moon size={24} color={getIconColor('dark')} />
        </ToggleGroupItem>

        <ToggleGroupItem
          value="system"
          className="h-10 w-10 flex items-center justify-center rounded-md transition-all cursor-pointer duration-300 hover:bg-background/40 data-[state=on]:bg-[#a8a5ff]"
          aria-label="System theme"
        >
          <Monitor size={24} color={getIconColor('system')} />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
