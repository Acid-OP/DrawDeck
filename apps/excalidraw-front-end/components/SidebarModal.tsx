import React from 'react';
import { SidebarItems } from './SidebarItems';

interface SidebarModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onClearCanvas: () => void;
}

export const SidebarModal: React.FC<SidebarModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeToggle,
  onClearCanvas
}) => {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute top-12 left-0 z-50 w-72 rounded-xl shadow-2xl transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#232329]' : 'bg-white border border-gray-200'
      }`}
      style={{
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <div className="p-3 pt-2">
        <SidebarItems theme={theme} onThemeToggle={onThemeToggle} onClearCanvas={onClearCanvas} />
      </div>
    </div>
  );
};
