"use client";
import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";

interface Props {
  roomId: string;
  encryptionKey: string;
  roomType: 'duo' | 'group';
  onClose?: () => void;
  isManualTrigger?: boolean;
  socket?: WebSocket | null;
}

export const ShareLinkModal: React.FC<Props> = ({ 
  roomId, 
  encryptionKey, 
  roomType,
  onClose,
  isManualTrigger = false,
  socket
}) => {
  const { theme } = useTheme(); 
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStoppingSession, setIsStoppingSession] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const shareableLink = `${window.location.origin}/${roomId}?key=${encryptionKey}&type=${roomType}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleStopSession = async () => {
    if (isStoppingSession) return;
    setIsStoppingSession(true);
    
    console.log('Stop Session clicked - sending leave message IMMEDIATELY');
    
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log('Sending leave_room message NOW');
        socket.send(JSON.stringify({ 
          type: 'leave_room', 
          roomId,
          encryptionKey,
          reason: 'user_initiated_stop'
        }));
        
        console.log('Leave message sent - participants should see creator left modal NOW');
      }
    } catch (error) {
      console.error('Error sending leave message:', error);
    }
    router.push('/');
  };

  useEffect(() => {
    if (isManualTrigger) {
      setIsVisible(true);
    } else {
      const hasVisited = sessionStorage.getItem(`visited-${roomId}`);
      if (!hasVisited) {
        setIsVisible(true);
        sessionStorage.setItem(`visited-${roomId}`, "true");
      } else {
        setIsVisible(false);
      }
    }
  }, [roomId, isManualTrigger]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isVisible) return null;

  const modalBg = theme === "dark" ? "#232329" : "#ffffff";
  const modalText = theme === "dark" ? "text-white" : "text-black";
  const inputBg = theme === "dark" ? "#1a1a1f" : "#e0dfff";
  const inputBorder = theme === "dark" ? "#333" : "#c9bfff";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className={`relative w-[480px] max-w-[90%] p-6 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.6)] border transition-all`}
        style={{ backgroundColor: modalBg, borderColor: theme === "dark" ? "#444" : inputBorder }}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-3" style={{ color: "#9e9aea" }}>
          Share Collaboration Link
        </h2>

        <p className={`${modalText} mb-6 leading-relaxed text-sm`}>
          Send this link to anyone you want to collaborate with. They'll be able to draw with you in real-time.
        </p>

        <div className="mb-4">
          <label className={`block text-xs font-medium mb-2 ${modalText}`}>Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareableLink}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-mono cursor-default`}
              style={{ 
                backgroundColor: inputBg, 
                border: `1px solid ${inputBorder}`, 
                color: theme === "dark" ? "#fff" : "#000",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            />
            <button
              onClick={handleCopy}
              className="bg-[#a8a5ff] text-black px-3 py-2 rounded-lg hover:bg-[#bbb8ff] transition-colors flex items-center gap-1.5 cursor-pointer font-semibold text-sm"
            >
              {copied ? (
                <>
                  <Check size={14} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className={`text-xs space-y-1 mb-6 ${modalText}`}>
          <p>Anyone with this link can join your collaborative session.</p>
          <p>Your session is end-to-end encrypted and private.</p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleStopSession}
            disabled={isStoppingSession}
            className={`${
              isStoppingSession 
                ? 'bg-red-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 active:bg-red-700 cursor-pointer'
            } text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2`}
          >
            {isStoppingSession ? 'Stopping Session...' : 'Stop Session'}
          </button>
        </div>
      </div>
    </div>
  );
};