"use client";
import { Canvas } from "@/components/Canvas";
import LoaderAnimation from '@/components/Loader';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  
  const MIN_LOADING_TIME = 2300; 
  
 useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, MIN_LOADING_TIME);
    return () => clearTimeout(timer);
  }, []);

  if (!minTimeElapsed) {
    return <LoaderAnimation />;
  }
  
  return (
    <Canvas 
      roomId="__solo"
      socket={null}
      isSolo={true}
    />
  );
}