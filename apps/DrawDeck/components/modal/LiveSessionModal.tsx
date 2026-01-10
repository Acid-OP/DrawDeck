"use client";

import React, { useState, useEffect, useRef } from "react";
import { SquareSlash, CopyIcon } from "lucide-react";

interface Props {
  onClose: () => void;
}

export const LiveSessionModal: React.FC<Props> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [roomURL, setRoomURL] = useState("");

 
  useEffect(() => {
    setRoomURL(window.location.href);
  }, []);

  const copyToClipboard = async () => {
    if (roomURL) await navigator.clipboard.writeText(roomURL);
  };

 
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-[#232329] text-white w-[760px] p-14 rounded-2xl shadow-2xl border border-[#333] text-left"
      >
        <h2 className="text-4xl font-bold mb-6" style={{ color: "#9e9aea" }}>
          Live collaboration
        </h2>

        <div className="mb-10">
          <label className="block text-lg text-white/80 mb-3">Room link</label>
          <div className="flex items-center gap-3 w-full">
            <input
              value={roomURL}
              readOnly
              className="flex-1 text-lg px-6 py-4 rounded-md bg-[#2e2d39] border border-[#444] text-white"
            />
            <button
              onClick={copyToClipboard}
              className="bg-[#bbb8ff] hover:bg-[#a8a5ff] text-black px-6 py-4 rounded-md flex items-center gap-2 cursor-pointer"
            >
              <CopyIcon size={18} /> Copy link
            </button>
          </div>
        </div>

        <hr className="border-t border-[#444] my-10" />

        <p className="text-base text-white/70 mb-10 leading-relaxed">
          Don't worry, the session is end-to-end encrypted, and fully private. Not even our server can see what you draw.
          <br /><br />
          Stopping the session will disconnect you from the room, but you'll be able to continue working with the scene locally. This won't affect others — they can continue collaborating.
        </p>

        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="border border-[#ffa8a5] text-[#ffa8a5] font-medium py-4 px-8 rounded-md flex items-center gap-2 hover:bg-[#3a2c2c] cursor-pointer"
          >
            <SquareSlash size={20} /> Stop session
          </button>
        </div>
      </div>
    </div>
  );
};
