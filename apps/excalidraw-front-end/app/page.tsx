"use client";
import { useAuth } from '@clerk/nextjs';
import { Canvas } from "@/components/Canvas";
import LoaderAnimation from '@/components/Loader';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  
  const MIN_LOADING_TIME = 2300; 
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_LOADING_TIME);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isLoaded || !minTimeElapsed) {
    return <LoaderAnimation />
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