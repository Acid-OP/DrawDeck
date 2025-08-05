"use client";
import React, { useState } from 'react';
import { Command, Trash2, Download, Upload, Share, UserPlus, LogOut, Github, Twitter, Linkedin } from 'lucide-react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { FeatureButton } from './sidebar/FeatureButton';
import { SocialButton } from './sidebar/SocialButton';
import { ThemeToggle } from './sidebar/ThemeToggle';
import { CanvasBackgroundPicker } from './sidebar/CanvasBackgroundPicker';
import { SidebarSeparator } from './sidebar/SidebarSeparator';
import { ShareLinkModal } from './modal/SharelinkModal';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from './modal/ConfirmModal';

interface SidebarItemsProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onClearCanvas: () => void;
  // Add these props for collaboration state
  isCollabMode?: boolean;
  roomId?: string;
  encryptionKey?: string;
  roomType?: 'duo' | 'group';
}

export const SidebarItems: React.FC<SidebarItemsProps> = ({ 
  theme, 
  onThemeToggle, 
  onClearCanvas,
  isCollabMode = false,
  roomId,
  encryptionKey,
  roomType
}) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  const handleShareClick = () => {
    if (isCollabMode && roomId && encryptionKey && roomType) {
      setShowShareModal(true);
    }
  };

  const handleAuthClick = async () => {
    if (isSignedIn) {
      await signOut();
    } else {
      router.push("/signup");
    }
  };

  const openClearConfirm = () => setShowClearConfirm(true);
  const closeClearConfirm = () => setShowClearConfirm(false);

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1">
          <FeatureButton 
            icon={<Command size={18} />} 
            label="Command Palette" 
            theme={theme} 
          />
          <FeatureButton 
            icon={<Trash2 size={18} />} 
            label="Clear Canvas" 
            onClick={openClearConfirm} 
            theme={theme} 
          />
          <FeatureButton 
            icon={<Download size={18} />} 
            label="Export Drawing" 
            theme={theme} 
          />
          <FeatureButton 
            icon={<Upload size={18} />} 
            label="Import Drawing" 
            theme={theme} 
          />
          
          {/* Conditionally render Share Collaboration button only when in collab mode */}
          {isCollabMode && roomId && encryptionKey && roomType && (
            <FeatureButton 
              icon={<Share size={18} />} 
              label="Share Collaboration" 
              onClick={handleShareClick} 
              theme={theme} 
            />
          )}
          
          <FeatureButton 
            icon={isSignedIn ? <LogOut size={18} /> : <UserPlus size={18} />} 
            label={isSignedIn ? "Logout" : "Sign Up"} 
            variant={isSignedIn ? "primary" : "primary"} 
            theme={theme} 
            onClick={handleAuthClick} 
          />
        </div>
        
        <SidebarSeparator theme={theme} />
        
        <div className="space-y-1">
          <SocialButton 
            icon={<Github size={18} />} 
            label="GitHub" 
            highlight={true} 
            theme={theme} 
          />
          <SocialButton 
            icon={<Twitter size={18} />} 
            label="Twitter/X" 
            theme={theme} 
          />
          <SocialButton 
            icon={<Linkedin size={18} />} 
            label="LinkedIn" 
            theme={theme} 
          />
        </div>
        
        <SidebarSeparator theme={theme} className="my-2" />
        
        <div>
          <ThemeToggle theme={theme} onThemeChange={onThemeToggle} />
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmModal 
          open={showClearConfirm} 
          setOpen={setShowClearConfirm} 
          onConfirm={onClearCanvas} 
          theme={theme} 
        />
      )}

      {/* Modal for manual trigger (button click) */}
      {showShareModal && isCollabMode && roomId && encryptionKey && roomType && (
        <ShareLinkModal 
          roomId={roomId}
          encryptionKey={encryptionKey}
          roomType={roomType}
          onClose={() => setShowShareModal(false)}
          isManualTrigger={true} // This tells the modal it was manually triggered
        />
      )}
    </>
  );
};