
import React from 'react';
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

interface SidebarItemsProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export const SidebarItems: React.FC<SidebarItemsProps> = ({ theme, onThemeToggle }) => {
  return (
    <div className="space-y-4">
      {/* Features Section - starts from top with compact spacing */}
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
          theme={theme}
        />
        <FeatureButton 
          icon={<UserPlus size={18} />} 
          label="Sign Up" 
          variant="primary"
          theme={theme}
        />
      </div>
      <SidebarSeparator theme={theme} />

      {/* Social Section - compact spacing, no divider */}
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

      {/* Theme Section - flows directly after social */}
      <div>
        <ThemeToggle theme={theme} onThemeChange={onThemeToggle} />
      </div>

      {/* Canvas Background - flows directly after theme */}
      <CanvasBackgroundPicker theme={theme} />
    </div>
  );
};
