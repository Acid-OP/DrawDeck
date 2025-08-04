"use client";
import React, { useEffect, useRef, useState } from "react";
import { Play, Users, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { generateRoomId } from "@/lib/generateRoomId";
import { generateAESKey } from "@/lib/crypto";

interface Props {
  onClose: () => void;
}

type RoomType = "duo" | "group";

export const LiveCollabModal: React.FC<Props> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType>("duo");

  const handleStartSession = async () => {
    if (!isSignedIn) {
      router.push("/signin");
      return;
    }

    const encryptionKey = await generateAESKey();
    const roomId = generateRoomId();
    onClose();

    sessionStorage.setItem(`creator-${roomId}`, "true");

    const redirectURL = `/${roomId}?key=${encryptionKey}&type=${selectedRoomType}`;
    router.push(redirectURL);
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="relative bg-[#232329] text-white w-[700px] min-h-[420px] p-12 rounded-2xl shadow-2xl text-center border border-[#333]"
      >
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#9e9aea" }}>
          Live collaboration
        </h2>

        <p className="text-lg text-white/80 font-light leading-6 mb-8">
          Invite people to collaborate on your drawing. <br />
          <br />
          Don't worry, the session is end-to-end encrypted, and fully private.
          Not even our server can see what you draw.
        </p>

        <div className="mb-8 space-y-4">
          <h3 className="text-lg font-medium text-white/90 mb-4">Choose your collaboration style:</h3>
          
          <label 
            className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
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
            />
            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
              selectedRoomType === "duo" ? "border-[#9e9aea]" : "border-[#666]"
            }`}>
              {selectedRoomType === "duo" && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#9e9aea]"></div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-1 text-left">
              <Video size={20} className="text-[#9e9aea]" />
              <div>
                <div className="font-medium text-white">Intimate Session (2 people max)</div>
                <div className="text-sm text-white/60">Perfect for focused collaboration with video calling</div>
              </div>
            </div>
          </label>

          <label 
            className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
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
            />
            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
              selectedRoomType === "group" ? "border-[#9e9aea]" : "border-[#666]"
            }`}>
              {selectedRoomType === "group" && (
                <div className="w-2.5 h-2.5 rounded-full bg-[#9e9aea]"></div>
              )}
            </div>
            <div className="flex items-center gap-3 flex-1 text-left">
              <Users size={20} className="text-[#9e9aea]" />
              <div>
                <div className="font-medium text-white">Group Session (Multiple people)</div>
                <div className="text-sm text-white/60">Great for team brainstorming with canvas-only collaboration</div>
              </div>
            </div>
          </label>
        </div>

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