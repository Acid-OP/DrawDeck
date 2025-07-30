"use client";

import { useAuth } from '@clerk/nextjs';
import { Canvas } from "@/components/Canvas";

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  
  // Show loading until auth state is determined to prevent flash
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#121212]">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <Canvas 
      roomName="__solo" 
      socket={null} 
      isSolo={true} 
      isUserAuthenticated={isSignedIn}
    />
  );
}