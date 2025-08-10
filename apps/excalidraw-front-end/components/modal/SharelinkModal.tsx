"use client";
import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, X } from "lucide-react";

interface Props {
  roomId: string;
  encryptionKey: string;
  roomType: 'duo' | 'group';
  onClose?: () => void;
  isManualTrigger?: boolean; 
}

export const ShareLinkModal: React.FC<Props> = ({ 
  roomId, 
  encryptionKey, 
  roomType,
  onClose,
  isManualTrigger = false 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);
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
    if (onClose) {
      onClose();
    }
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="relative bg-[#232329] text-white w-[480px] max-w-[90%] p-6 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-[#444] transition-all"
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

        <p className="text-white/80 mb-6 leading-relaxed text-sm">
          Send this link to anyone you want to collaborate with. They'll be able to draw with you in real-time.
        </p>

        <div className="mb-4">
          <label className="block text-xs font-medium text-white/90 mb-2">Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareableLink}
              className="flex-1 bg-[#1a1a1f] border border-[#333] rounded-lg px-3 py-2 text-white/90 text-xs font-mono cursor-default"
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

        <div className="text-xs text-white/60 space-y-1">
          <p>💡 Anyone with this link can join your collaborative session.</p>
          <p>🔒 Your session is end-to-end encrypted and private.</p>
        </div>
      </div>
    </div>
  );
};