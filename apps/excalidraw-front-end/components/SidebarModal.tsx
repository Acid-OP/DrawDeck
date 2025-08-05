import React from 'react';
import { SidebarItems } from './SidebarItems';

interface SidebarModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onClearCanvas: () => void;
  // Add collaboration props
  isCollabMode?: boolean;
  roomId?: string;
  encryptionKey?: string;
  roomType?: 'duo' | 'group';
}

export const SidebarModal: React.FC<SidebarModalProps> = ({ 
  isOpen, 
  onClose, 
  theme, 
  onThemeToggle, 
  onClearCanvas,
  isCollabMode = false,
  roomId,
  encryptionKey,
  roomType
}) => {
  if (!isOpen) return null;

  return (
    <div className={`absolute top-12 left-0 z-50 w-72 rounded-xl shadow-2xl transition-all duration-300 ${ 
      theme === 'dark' ? 'bg-[#232329]' : 'bg-white border border-gray-200' 
    }`}
      style={{ 
        maxHeight: '90vh', 
        overflowY: 'auto', 
      }}
    >
      <div className="p-3 pt-2">
        <SidebarItems 
          theme={theme} 
          onThemeToggle={onThemeToggle} 
          onClearCanvas={onClearCanvas}
          isCollabMode={isCollabMode}
          roomId={roomId}
          encryptionKey={encryptionKey}
          roomType={roomType}
        />
      </div>
    </div>
  );
};