"use client";
import { useAuth } from '@clerk/nextjs';
import { RoomCanvas } from "@/components/RoomCanvas";

export default async function CanvasPage({ params }: { params: { slug: string } }) {
  const p = await params;
  const roomName = (p.slug); // Directly use slug
  
  return <AuthWrapper roomName={roomName} />;
}

function AuthWrapper({ roomName }: { roomName: string }) {
  const { isSignedIn, isLoaded } = useAuth();

  // Show loading while Clerk loads
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
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

  // User is authenticated, show the collaborative canvas
  return <RoomCanvas slug={roomName} />;
}