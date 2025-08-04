"use client";

import { AuthWrapper } from "@/components/AuthWrapper";
import LoaderAnimation from "@/components/Loader";
import { useParams, useSearchParams } from "next/navigation";

export default function CanvasPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // Get roomId from URL params and encryptionKey from query params
  const roomId = params.slug as string;
  const encryptionKey = searchParams.get('key');

  console.log("🏠 Canvas Page - roomId:", roomId, "encryptionKey:", encryptionKey);

  if (!roomId || !encryptionKey) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoaderAnimation />
          <p className="mt-4">Loading room...</p>
        </div>
      </div>
    );
  }

  return <AuthWrapper roomId={roomId} encryptionKey={encryptionKey} />;
}