"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { WS_URL, BACKEND_URL } from "@/config";
import { Canvas } from "./Canvas";

export function RoomCanvas({ slug }: { slug: string }) {
  const [roomId, setRoomId] = useState<number | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [token, setToken] = useState<string>("");

  // Fetch roomId from slug
  useEffect(() => {
    async function fetchRoom() {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/room/${slug}`);
        setRoomId(data.room.id);
      } catch (err) {
        console.error("Failed to fetch room:", err);
      }
    }
    fetchRoom();
  }, [slug]);

  useEffect(() => {
    const storedToken = localStorage.getItem("token") ?? "";
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!roomId || !token) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join_room", roomId }));
      setSocket(ws);
    };
    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "leave_room", roomId }));
        ws.close();
      }
    };
  }, [roomId, token]);

  if (!roomId) return <div className="p-6">Loading room…</div>;
  if (!socket) return <div className="p-6">Connecting to socket…</div>;

  return <Canvas roomId={roomId} socket={socket} />;
}
