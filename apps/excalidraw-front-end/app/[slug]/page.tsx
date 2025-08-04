"use client";
import { AuthWrapper } from "@/components/AuthWrapper";
import LoaderAnimation from "@/components/Loader";
import { useParams, useSearchParams } from "next/navigation";

export default function CanvasPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const roomId = params.slug as string;
  const encryptionKey = searchParams.get('key');
  const roomType = searchParams.get('type') as 'duo' | 'group';

  if (!roomId || !encryptionKey) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <LoaderAnimation />
        </div>
      </div>
    );
  }

  return <AuthWrapper roomId={roomId} encryptionKey={encryptionKey} roomType={roomType} />;
}