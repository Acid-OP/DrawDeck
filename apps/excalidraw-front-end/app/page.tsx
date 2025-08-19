"use client";
import { useAuth } from "@clerk/nextjs";
import { Canvas } from "@/components/Canvas";
import LoaderAnimation from "@/components/Loader";
import { useEffect, useState } from "react";
import Toast from "@/components/Toast";
import { useAuthToast } from "@/hooks/useAuthToast";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { toastMessage } = useAuthToast();
  const isMobile = useIsMobile();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const MIN_LOADING_TIME = 2300;

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_LOADING_TIME);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded || !minTimeElapsed) {
    return <LoaderAnimation />;
  }

  return (
    <>
      <Canvas
        roomId="__solo"
        socket={null}
        isSolo={true}
        className={isMobile ? "touch-manipulation" : "touch-none"}
        isUserAuthenticated={isSignedIn}
      />
      {toastMessage && <Toast message={toastMessage}/>}
    </>
  );
}
