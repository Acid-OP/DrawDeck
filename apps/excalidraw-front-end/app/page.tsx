"use client";

import { useAuth } from '@clerk/nextjs';
import { Canvas } from "@/components/Canvas";
import { LoadingScreen } from '@/components/Loader';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  
  // Show loading until auth state is determined to prevent flash
  if (!isLoaded) {
    return <LoadingScreen/>
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