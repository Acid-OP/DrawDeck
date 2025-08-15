"use client";
import { AuthWrapper } from "@/components/AuthWrapper";
import LoaderAnimation from "@/components/Loader";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function CanvasPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayElapsed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const roomId = params.slug as string | undefined;
  const encryptionKey = searchParams.get('key');
  const roomType = searchParams.get('type') as 'duo' | 'group' | null;
  if ((!roomId || !encryptionKey) && !minDelayElapsed) {
    return null;
  }

  if (!roomId || !encryptionKey) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoaderAnimation />
      </div>
    );
  }

  return <AuthWrapper roomId={roomId} encryptionKey={encryptionKey} roomType={roomType!} />;
}