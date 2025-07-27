"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SquareSlash } from "lucide-react";
import { useAuth } from "@clerk/nextjs"; 

interface Props {
  onClose: () => void;
}

export const LiveSessionInitModal: React.FC<Props> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [roomName, setRoomName] = useState("");
  const router = useRouter();
  const { isSignedIn } = useAuth(); 

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = roomName.trim();

    if (!isSignedIn) {
      router.push("/signin"); 
      return;
    }

    if (!trimmed) {
      alert("Please enter a room name");
      return;
    }

    router.push(`/canvas/${trimmed}`);
  };

 
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  
  useEffect(() => {
    const click = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", click);
    return () => document.removeEventListener("mousedown", click);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-[#232329] text-white w-[500px] p-10 rounded-2xl shadow-2xl border border-[#333]"
      >
        <h2 className="text-3xl font-bold mb-6 text-center" style={{ color: "#9e9aea" }}>
          Create New Room
        </h2>

        <form onSubmit={handleCreateRoom} className="space-y-6">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter Room Name"
            className="w-full p-4 rounded-md bg-[#2e2d39] border border-[#444] text-white text-lg"
          />

          <button
            type="submit"
            className="bg-[#bbb8ff] hover:bg-[#a8a5ff] text-black w-full py-4 rounded-md text-lg font-medium"
          >
            Create Room
          </button>
        </form>

        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="border border-[#ffa8a5] text-[#ffa8a5] font-medium py-2 px-6 rounded-md flex items-center gap-2 hover:bg-[#3a2c2c]"
          >
            <SquareSlash size={18} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
