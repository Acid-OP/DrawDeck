"use client";

import React, { useState } from 'react';
import { 
  Command, 
  Trash2, 
  Download, 
  Upload, 
  Users, 
  UserPlus, 
  Github, 
  Twitter, 
  Linkedin
} from 'lucide-react';
import { FeatureButton } from './sidebar/FeatureButton';
import { SocialButton } from './sidebar/SocialButton';
import { ThemeToggle } from './sidebar/ThemeToggle';
import { CanvasBackgroundPicker } from './sidebar/CanvasBackgroundPicker';
import { SidebarSeparator } from './sidebar/SidebarSeparator';
import { LiveCollabModal } from './modal/LiveCollabModal';
import { Router } from 'next/router';
import { useRouter } from 'next/navigation';

interface SidebarItemsProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const SidebarItems: React.FC<SidebarItemsProps> = ({ theme, onThemeToggle }) => {
  const [showLiveModal, setShowLiveModal] = useState(false);
 const router = useRouter();
  const handleLiveClick = () => {
    setShowLiveModal(true);
  };

  const handleSignupClick = () => {
    router.push("/signup");
  };
  const handleCreateRoom = () => {
    const roomSlug = generateRoomIdAndKey();
    window.location.href = `/canvas/${roomSlug}`;
  };

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
            icon={<UserPlus size={18} />} 
            label="Sign Up" 
            variant="primary"
            theme={theme}
            onClick={handleSignupClick}
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

        <CanvasBackgroundPicker theme={theme} />
      </div>

      {showLiveModal && (
        <LiveCollabModal 
          onClose={() => setShowLiveModal(false)}
        />
      )}
    </>
  );
};

function generateRoomIdAndKey(): string {
  const roomId = crypto.randomUUID().replace(/-/g, "").slice(0, 20);
  const roomKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('');
  return `${roomId},${roomKey}`;
}
