"use client";

import { useEffect, useState } from "react";
import { WS_URL } from "@/config";
import { Canvas } from "./Canvas";

export function RoomCanvas({ slug }: { slug: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    const storedToken = localStorage.getItem("token") ?? "";
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!slug || !token) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join_room", roomName: slug }));
      setSocket(ws);
    };

    ws.onerror = (err) => {
      console.error("❌ WebSocket error:", err);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "leave_room", roomName: slug }));
        ws.close();
      }
    };
  }, [slug, token]);

  if (!socket) return <div className="p-6">Connecting to socket…</div>;

  return <Canvas roomName={slug} socket={socket} />;
}
