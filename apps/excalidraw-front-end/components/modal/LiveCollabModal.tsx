"use client";
import React, { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

interface Props {
  onClose: () => void;
}

export const LiveCollabModal: React.FC<Props> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleStartSession = () => {
    // Check if user is signed in
    if (!isSignedIn) {
      // Redirect to sign in page
      router.push('/signin');
      return;
    }

    // Generate a random URL-safe string
    const randomId = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    
    // Close current modal and navigate to the room
    onClose();
    
    // Navigate to the collaborative room
    router.push(`/${randomId}`);
  };

  // ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Outside click
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="relative bg-[#232329] text-white w-[700px] min-h-[350px] p-12 rounded-2xl shadow-2xl text-center border border-[#333]"
      >
        <h2 className="text-2xl font-bold" style={{ color: "#9e9aea" }}>
          Live collaboration
        </h2>

        <p className="text-lg text-white/80 font-light leading-6 mb-6">
          <br />Invite people to collaborate on your drawing. <br />
          <br />Don't worry, the session is end-to-end encrypted, and fully
          private. Not even our server can see what you draw.
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