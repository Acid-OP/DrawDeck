"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, ClipboardCopy } from "lucide-react";

interface Props {
  onClose: () => void;
  onCreateRoom: () => void; // not used here but retained for props consistency
}

export const LiveCollabModal: React.FC<Props> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showSecondModal, setShowSecondModal] = useState(false);
  const dummyURL = "https://your-app.com/canvas/abc123";

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on outside click
  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleStartSession = () => {
    setShowSecondModal(true);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(dummyURL);
  };

  // Second modal (no room logic)
  if (showSecondModal) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#232329] text-white w-[600px] p-10 rounded-2xl shadow-2xl border border-[#333] text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ color: "#9e9aea" }}>
            Collaboration started
          </h2>
          <p className="text-white/80 text-sm mb-6">
            Share the link below to invite others into this room:
          </p>
          <div className="flex items-center justify-between bg-[#1d1d1f] border border-[#444] px-4 py-2 rounded-md mb-6">
            <span className="truncate text-sm text-white/90">{dummyURL}</span>
            <button onClick={copyToClipboard} className="text-[#a8a5ff] hover:opacity-80">
              <ClipboardCopy size={18} />
            </button>
          </div>
          <p className="text-white/60 text-xs">
            You can now collaborate in real time with others. Everything is end-to-end encrypted.
          </p>
        </div>
      </div>
    );
  }

  // First modal (unchanged UI)
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="relative bg-[#232329] text-white w-[700px] min-h-[350px]  p-12 rounded-2xl shadow-2xl text-center border border-[#333]"
      >
        <h2 className="text-2xl font-bold" style={{ color: "#9e9aea" }}>
          Live collaboration
        </h2>

        <p className="text-lg text-white/80 font-light leading-6 mb-6">
          <br />
          Invite people to collaborate on your drawing. <br />
          <br />
          Don’t worry, the session is end-to-end encrypted, and fully private.
          Not even our server can see what you draw.
        </p>

        <button
          onClick={handleStartSession}
          className="bg-[#a8a5ff] text-black font-medium py-4 px-10 rounded-md flex items-center justify-center gap-2 mx-auto transition-all cursor-pointer hover:bg-[#bbb8ff]"
        >
          <Play size={25} className="text-black" />
          <span className="text-lg font-medium">Start session</span>
        </button>
      </div>
    </div>
  );
};
