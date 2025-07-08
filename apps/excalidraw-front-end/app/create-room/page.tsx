'use client';
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { BACKEND_URL } from "@/config";

export default function CreateRoomPage() {
  const [roomName, setRoomName] = useState("");
  const router = useRouter();

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    console.log("🔑 token from localStorage:", token);

    if (!token) return alert("Please login first");

    try {
      await axios.post(
        `${BACKEND_URL}/room`,
        { name: roomName },
        { headers: { Authorization: `${token}` } }
      );
      router.push(`/canvas/${roomName}`);
    } catch (err) {
      alert("Room creation failed. Check console.");
      console.error(err);
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-xl mb-4">Create Room</h1>
      <form onSubmit={handleCreateRoom} className="space-y-4">
        <input className="border p-2 w-full" placeholder="Room Name" value={roomName} onChange={e => setRoomName(e.target.value)} />
        <button className="bg-purple-600 text-white px-4 py-2" type="submit">Create Room</button>
      </form>
    </div>
  );
}
