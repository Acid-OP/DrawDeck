"use client";
import React, { useEffect, useRef, useState } from "react";
import { Play, Users, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { generateRoomId } from "@/lib/generateRoomId";
import { generateSecureKey } from "@/lib/crypto";

interface Props {
  onClose: () => void;
}

type RoomType = "duo" | "group";

export const LiveCollabModal: React.FC<Props> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>("duo");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSession = async () => {
    if (!isSignedIn) {
      router.push("/signin");
      return;
    }

    setIsLoading(true);
    
    try {
      const encryptionKey = await generateSecureKey();
      const roomId = generateRoomId();
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`creator-${roomId}`, "true");
      }

      const redirectURL = `/${roomId}?key=${encryptionKey}&type=${selectedRoomType}`;
      
      onClose();
      router.push(redirectURL);
      
    } catch (error) {
      console.error('Error starting session:', error);
      setError('Failed to start session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
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

  // Add blur effect to body when modal is mounted
  useEffect(() => {
    // Add blur class to body
    document.body.classList.add('modal-open-blur');
    
    // Remove blur class when component unmounts
    return () => {
      document.body.classList.remove('modal-open-blur');
    };
  }, []);

return (
<div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 backdrop-blur-sm bg-black/50">
  <div
    ref={modalRef}
    className="modal-content relative bg-[#232329] text-white w-[500px] min-h-[350px] p-8 rounded-xl shadow-2xl text-center border border-[#333]"
    >
      <h2 className="text-lg font-bold mb-2" style={{ color: "#9e9aea" }}>
        Live collaboration
      </h2>

      <p className="text-sm text-white/80 font-light leading-5 mb-6">
        Invite people to collaborate on your drawing. <br />
        <br />
        Don't worry, the session is end-to-end encrypted, and fully private.
        Not even our server can see what you draw.
      </p>

      {error && (
        <div className="mb-5 p-2.5 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-200 text-xs">
          {error}
        </div>
      )}

      <div className="mb-6 space-y-3">
        <h3 className="text-sm font-medium text-white/90 mb-3">Choose your collaboration style:</h3>
        
        <label 
          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
            selectedRoomType === "duo" 
              ? "border-[#9e9aea] bg-[#9e9aea]/10" 
              : "border-[#444] hover:border-[#666] bg-transparent"
          }`}
        >
          <input
            type="radio"
            name="roomType"
            value="duo"
            checked={selectedRoomType === "duo"}
            onChange={(e) => setSelectedRoomType(e.target.value as RoomType)}
            className="sr-only"
            disabled={isLoading}
          />
          <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
            selectedRoomType === "duo" ? "border-[#9e9aea]" : "border-[#666]"
          }`}>
            {selectedRoomType === "duo" && (
              <div className="w-2 h-2 rounded-full bg-[#9e9aea]"></div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 text-left">
            <Video size={16} className="text-[#9e9aea]" />
            <div>
              <div className="font-medium text-white text-xs">Intimate Session (2 people max)</div>
              <div className="text-[11px] text-white/60">Perfect for focused collaboration with video calling</div>
            </div>
          </div>
        </label>

        <label 
          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
            selectedRoomType === "group" 
              ? "border-[#9e9aea] bg-[#9e9aea]/10" 
              : "border-[#444] hover:border-[#666] bg-transparent"
          }`}
        >
          <input
            type="radio"
            name="roomType"
            value="group"
            checked={selectedRoomType === "group"}
            onChange={(e) => setSelectedRoomType(e.target.value as RoomType)}
            className="sr-only"
            disabled={isLoading}
          />
          <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
            selectedRoomType === "group" ? "border-[#9e9aea]" : "border-[#666]"
          }`}>
            {selectedRoomType === "group" && (
              <div className="w-2 h-2 rounded-full bg-[#9e9aea]"></div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 text-left">
            <Users size={16} className="text-[#9e9aea]" />
            <div>
              <div className="font-medium text-white text-xs">Group Session (Multiple people)</div>
              <div className="text-[11px] text-white/60">Great for team brainstorming with canvas-only collaboration</div>
            </div>
          </div>
        </label>
      </div>

      <button
        onClick={handleStartSession}
        disabled={isLoading}
        className="bg-[#a8a5ff] text-black font-medium py-3 px-8 rounded-md flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer hover:bg-[#bbb8ff] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play size={18} className="text-black" />
        <span className="text-sm font-medium">
          {isLoading ? "Starting..." : "Start session"}
        </span>
      </button>
    </div>
  </div>
);

};