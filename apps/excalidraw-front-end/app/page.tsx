"use client";
import { useAuth } from '@clerk/nextjs';
import { Canvas } from "@/components/Canvas";
import LoaderAnimation from '@/components/Loader';
import { useEffect, useState } from 'react';
import Toast from "@/components/Toast";

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const MIN_LOADING_TIME = 2300; 
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_LOADING_TIME);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setToastMessage("✅ Successfully signed in!");
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !minTimeElapsed) {
    return <LoaderAnimation />
  }
  
  return (
    <>
      <Canvas 
        roomId="__solo"
        socket={null}
        isSolo={true}
        isUserAuthenticated={isSignedIn}
      />
      {toastMessage && <Toast message="Successfully signed up!" theme="dark" />}
    </>
  );
}