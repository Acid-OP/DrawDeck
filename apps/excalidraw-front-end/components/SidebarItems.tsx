"use client";
import React, { useState } from "react";
import { Command, Trash2, Download, Upload, Share, UserPlus, LogOut, Github, Twitter, Linkedin } from "lucide-react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { FeatureButton } from "./sidebar/FeatureButton";
import { SocialButton } from "./sidebar/SocialButton";
import { ThemeToggle } from "./sidebar/ThemeToggle";
import { SidebarSeparator } from "./sidebar/SidebarSeparator";
import { ShareLinkModal } from "./modal/SharelinkModal";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "./modal/ConfirmModal";
import { LiveCollabModal } from "./modal/LiveCollabModal";
import { useTheme } from "@/context/ThemeContext"; 

interface SidebarItemsProps {
  onClearCanvas: () => void;
  isCollabMode?: boolean;
  roomId?: string;
  encryptionKey?: string;
  roomType?: "duo" | "group";
  isMobile?: boolean;
}

export const SidebarItems: React.FC<SidebarItemsProps> = ({
  onClearCanvas,
  isCollabMode = false,
  roomId,
  encryptionKey,
  roomType,
  isMobile = false,
}) => {
  const { theme } = useTheme();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();

  const handleShareClick = () => {
    if (isCollabMode && roomId && encryptionKey && roomType) {
      setShowShareModal(true);
    }
  };

  const handleLiveClick = () => setShowLiveModal(true);

  const handleAuthClick = async () => {
    if (isSignedIn) {
      await signOut();
    } else {
      router.push("/signup");
    }
  };

  const openClearConfirm = () => setShowClearConfirm(true);

  return (
    <>
      <div className="space-y-3 text-[13px]">
        <div className="space-y-[3px]">
          <FeatureButton icon={<Command size={14} />} label="Command Palette" />
          <FeatureButton icon={<Trash2 size={14} />} label="Clear Canvas" onClick={openClearConfirm} />
          <FeatureButton icon={<Download size={14} />} label="Export Drawing" />
          <FeatureButton icon={<Upload size={14} />} label="Import Drawing" />

          {!isCollabMode && <FeatureButton icon={<Upload size={14} />} label="Live Collaboration" onClick={handleLiveClick} />}

          {isCollabMode && roomId && encryptionKey && roomType && (
            <FeatureButton icon={<Share size={14} />} label="Share Collaboration" onClick={handleShareClick} />
          )}

          <FeatureButton
            icon={isSignedIn ? <LogOut size={14} /> : <UserPlus size={14} />}
            label={isSignedIn ? "Logout" : "Sign Up"}
            variant="primary"
            onClick={handleAuthClick}
          />
        </div>

        <SidebarSeparator />

        <div className="space-y-[3.5px]">
          <SocialButton icon={<Github size={14} />} label="GitHub" highlight onClick={() => window.open("https://github.com/Acid-OP/excalidraw", "_blank")} />
          <SocialButton icon={<Twitter size={14} />} label="Twitter/X" onClick={() => window.open("https://x.com/GauravKapurr", "_blank")} />
          <SocialButton icon={<Linkedin size={14} />} label="LinkedIn" onClick={() => window.open("https://www.linkedin.com/in/gaurav-kapur-a3286b258/", "_blank")} />
        </div>

        <SidebarSeparator className="my-[6px]" />

        <div className={isMobile ? "" : "scale-90 origin-left"}>
          <ThemeToggle isMobile={isMobile} />
        </div>
      </div>

      {showClearConfirm && <ConfirmModal open={showClearConfirm} setOpen={setShowClearConfirm} onConfirm={onClearCanvas} />}
      {showLiveModal && <LiveCollabModal onClose={() => setShowLiveModal(false)} source="sidebar" />}
      {showShareModal && isCollabMode && roomId && encryptionKey && roomType && (
        <ShareLinkModal roomId={roomId} encryptionKey={encryptionKey} roomType={roomType} onClose={() => setShowShareModal(false)} isManualTrigger />
      )}
    </>
  );
};
