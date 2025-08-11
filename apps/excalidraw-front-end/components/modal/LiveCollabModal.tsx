"use client";
import React, { useEffect, useRef, useState } from "react";
import { Play, Users, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { generateRoomId } from "@/lib/generateRoomId";
import { generateSecureKey } from "@/lib/crypto";

interface Props {
  onClose: () => void;
  source?: 'header' | 'sidebar' | 'share';
}

type RoomType = "duo" | "group";

export const LiveCollabModal: React.FC<Props> = ({ onClose, source = 'header' }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>("duo");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCompact = source === 'sidebar' || source === 'share';

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
  
  useEffect(() => {
    document.body.classList.add('modal-open-blur');
    return () => {
      document.body.classList.remove('modal-open-blur');
    };
  }, []);

return (
<div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 backdrop-blur-sm bg-black/50">
  <div
    ref={modalRef}
    className={`modal-content relative bg-[#232329] text-white rounded-xl shadow-2xl text-center border border-[#333] ${
      isCompact 
        ? 'w-[470px] min-h-[335px] p-7' 
        : 'w-[500px] min-h-[350px] p-8'
    }`}
    >
      <h2 className={`font-bold mb-2 ${isCompact ? 'text-lg' : 'text-lg'}`} style={{ color: "#9e9aea" }}>
        Live collaboration
      </h2>

      <p className={`text-white/80 font-light leading-5 ${isCompact ? 'text-sm mb-5' : 'text-sm mb-6'}`}>
        Invite people to collaborate on your drawing. <br />
        <br />
        Don't worry, the session is end-to-end encrypted, and fully private.
        Not even our server can see what you draw.
      </p>

      {error && (
        <div className={`bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-200 text-xs ${
          isCompact ? 'mb-4 p-2.5' : 'mb-5 p-2.5'
        }`}>
          {error}
        </div>
      )}

      <div className={`space-y-3 ${isCompact ? 'mb-5' : 'mb-6'}`}>
        <h3 className={`font-medium text-white/90 ${isCompact ? 'text-sm mb-2' : 'text-sm mb-3'}`}>Choose your collaboration style:</h3>
        
        <label 
          className={`flex items-center rounded-lg border cursor-pointer transition-all ${
            isCompact ? 'p-3' : 'p-3'
          } ${
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
          <div className={`rounded-full border-2 flex items-center justify-center ${
            isCompact ? 'w-4 h-4 mr-3' : 'w-4 h-4 mr-3'
          } ${
            selectedRoomType === "duo" ? "border-[#9e9aea]" : "border-[#666]"
          }`}>
            {selectedRoomType === "duo" && (
              <div className={`rounded-full bg-[#9e9aea] ${isCompact ? 'w-2 h-2' : 'w-2 h-2'}`}></div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 text-left">
            <Video size={isCompact ? 15 : 16} className="text-[#9e9aea]" />
            <div>
              <div className={`font-medium text-white ${isCompact ? 'text-xs' : 'text-xs'}`}>Intimate Session (2 people max)</div>
              <div className={`text-white/60 ${isCompact ? 'text-[11px]' : 'text-[11px]'}`}>Perfect for focused collaboration with video calling</div>
            </div>
          </div>
        </label>

        <label 
          className={`flex items-center rounded-lg border cursor-pointer transition-all ${
            isCompact ? 'p-3' : 'p-3'
          } ${
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
          <div className={`rounded-full border-2 flex items-center justify-center ${
            isCompact ? 'w-4 h-4 mr-3' : 'w-4 h-4 mr-3'
          } ${
            selectedRoomType === "group" ? "border-[#9e9aea]" : "border-[#666]"
          }`}>
            {selectedRoomType === "group" && (
              <div className={`rounded-full bg-[#9e9aea] ${isCompact ? 'w-2 h-2' : 'w-2 h-2'}`}></div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1 text-left">
            <Users size={isCompact ? 15 : 16} className="text-[#9e9aea]" />
            <div>
              <div className={`font-medium text-white ${isCompact ? 'text-xs' : 'text-xs'}`}>Group Session (Multiple people)</div>
              <div className={`text-white/60 ${isCompact ? 'text-[11px]' : 'text-[11px]'}`}>Great for team brainstorming with canvas-only collaboration</div>
            </div>
          </div>
        </label>
      </div>

      <button
        onClick={handleStartSession}
        disabled={isLoading}
        className={`bg-[#a8a5ff] text-black font-medium rounded-md flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer hover:bg-[#bbb8ff] disabled:opacity-50 disabled:cursor-not-allowed ${
          isCompact ? 'py-3 px-7' : 'py-3 px-8'
        }`}
      >
        <Play size={isCompact ? 17 : 18} className="text-black" />
        <span className={`font-medium ${isCompact ? 'text-sm' : 'text-sm'}`}>
          {isLoading ? "Starting..." : "Start session"}
        </span>
      </button>
    </div>
  </div>
);

};