"use client";

import React, { useState } from 'react';
import { 
  Command, 
  Trash2, 
  Download, 
  Upload, 
  Users, 
  UserPlus, 
  LogOut,
  Github, 
  Twitter, 
  Linkedin
} from 'lucide-react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { FeatureButton } from './sidebar/FeatureButton';
import { SocialButton } from './sidebar/SocialButton';
import { ThemeToggle } from './sidebar/ThemeToggle';
import { CanvasBackgroundPicker } from './sidebar/CanvasBackgroundPicker';
import { SidebarSeparator } from './sidebar/SidebarSeparator';
import { LiveCollabModal } from './modal/LiveCollabModal';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from './modal/ConfirmModal';

interface SidebarItemsProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onClearCanvas: () => void;
}

export const SidebarItems: React.FC<SidebarItemsProps> = ({ theme, onThemeToggle, onClearCanvas }) => {
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  const handleLiveClick = () => {
    setShowLiveModal(true);
  };

  const handleAuthClick = async () => {
    if (isSignedIn) {
      // User is signed in, so log them out
      await signOut();
    } else {
      // User is not signed in, redirect to signup
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
          <FeatureButton 
            icon={<Users size={18} />} 
            label="Live Collaboration" 
            onClick={handleLiveClick}
            theme={theme}
          />
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

      {showLiveModal && (
        <LiveCollabModal 
          onClose={() => setShowLiveModal(false)}
        />
      )}
    </>
  );
};

