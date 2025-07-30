"use client";
import { useAuth } from '@clerk/nextjs';
import { RoomCanvas } from "@/components/RoomCanvas";
import { useParams } from 'next/navigation';
import { ShareLinkModal } from '@/components/modal/SharelinkModal';
import { LoadingScreen } from '@/components/Loader';

export default function CanvasPage() {
  const params = useParams();
  const roomName = params.slug as string;
  
  return <AuthWrapper roomName={roomName} />;
}

function AuthWrapper({ roomName }: { roomName: string }) {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while Clerk loads
  if (!isLoaded) {
    return <LoadingScreen/>
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-6 text-center">
          <p className="text-lg mb-4">Please sign in to join collaborative rooms</p>
          <a 
            href="/signin"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // User is authenticated, show the collaborative canvas with share modal
  return (
    <>
      {/* Share Link Modal - shows on initial load */}
      <ShareLinkModal roomId={roomName} />
      
      {/* The actual canvas */}
      <RoomCanvas slug={roomName} />
    </>
  );
}