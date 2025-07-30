"use client";
import React, { useState, useRef, useEffect } from "react";
import { Copy, Check, X } from "lucide-react";

interface Props {
  roomId: string;
}

export const ShareLinkModal: React.FC<Props> = ({ roomId }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Generate the shareable link
  const shareableLink = `${window.location.origin}/${roomId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside handler
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="relative bg-[#232329] text-white w-[600px] p-8 rounded-2xl shadow-2xl border border-[#333]"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-2" style={{ color: "#9e9aea" }}>
          Share Collaboration Link
        </h2>
        
        <p className="text-white/80 mb-6">
          Share this link with others to collaborate on your drawing in real-time.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-white/90 mb-2">
            Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareableLink}
              className="flex-1 bg-[#1a1a1f] border border-[#333] rounded-lg px-4 py-3 text-white/90 text-sm font-mono"
            />
            <button
              onClick={handleCopy}
              className="bg-[#a8a5ff] text-black px-4 py-3 rounded-lg hover:bg-[#bbb8ff] transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-sm text-white/60">
          <p>💡 Anyone with this link can join your collaborative session.</p>
          <p>🔒 Your session is end-to-end encrypted and private.</p>
        </div>
      </div>
    </div>
  );
};