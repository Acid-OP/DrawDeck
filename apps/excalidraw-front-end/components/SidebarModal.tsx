import React, { useEffect, useState } from 'react';
import { SidebarItems } from './SidebarItems';

interface SidebarModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onClearCanvas: () => void;
  isCollabMode?: boolean;
  roomId?: string;
  encryptionKey?: string;
  roomType?: 'duo' | 'group';
  isMobile?: boolean;
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
  roomType,
  isMobile = false
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => onClose(), 250);
  };

  if (isMobile) {
    return (
      <>
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
            isAnimating ? 'opacity-50' : 'opacity-0'
          }`}
          onClick={handleClose}
        />
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-lg shadow-2xl transition-transform duration-300 ${
            theme === 'dark' ? 'bg-[#232329]' : 'bg-white border border-gray-200'
          } ${
            isAnimating ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          <div className="p-4">
            <SidebarItems
              theme={theme}
              onThemeToggle={onThemeToggle}
              onClearCanvas={onClearCanvas}
              isCollabMode={isCollabMode}
              roomId={roomId}
              encryptionKey={encryptionKey}
              roomType={roomType}
              isMobile={isMobile}
            />
          </div>
        </div>
      </>
    );
  }

  // Desktop 
  return (
    <div
      className={`rounded-lg shadow-2xl transition-all duration-300 ${
        theme === 'dark' ? 'bg-[#232329]' : 'bg-white border border-gray-200'
      }`}
      style={{
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <div className="p-2">
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