"use client";

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";
import { SquareSlash } from "lucide-react";

interface Props {
  onClose: () => void;
}

export const LiveSessionInitModal: React.FC<Props> = ({ onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return alert("Please enter a room name");

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      onClose();
      return;
    }

    try {
      setCreating(true);
      await axios.post(
        `${BACKEND_URL}/room`,
        { name: roomName },
        {
          headers: {
            Authorization: `${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      router.push(`/canvas/${roomName}`);
    } catch (err) {
      console.error("❌ Room creation failed", err);
      alert("Room creation failed. Check console.");
      onClose();
    } finally {
      setCreating(false);
    }
  };

  // Escape key
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  // Outside click
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
            disabled={creating}
            className="bg-[#bbb8ff] hover:bg-[#a8a5ff] text-black w-full py-4 rounded-md text-lg font-medium disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create Room"}
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
