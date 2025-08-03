"use client";
import { AuthWrapper } from "@/components/AuthWrapper";
import LoaderAnimation from "@/components/Loader";
import { useEffect, useState } from "react";

export default function CanvasPage() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#room=")) {
      const data = hash.replace("#room=", "");
      const [id, key] = data.split(",");
      setRoomId(id);
      setEncryptionKey(key);
    }
  }, []);

  if (!roomId || !encryptionKey) return <LoaderAnimation />;

  return <AuthWrapper roomId={roomId} encryptionKey={encryptionKey} />;
}