"use client";
import { useEffect, useState } from "react";
import { Canvas } from "@/components/Canvas";
import LoaderAnimation from "@/components/Loader";
import Toast from "@/components/Toast";
import { useAuthToast } from "@/hooks/useAuthToast";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loaderAnimationComplete, setLoaderAnimationComplete] = useState(false);  
  const { status } = useSession();
  const isSignedIn = status === "authenticated";

  useEffect(() => {
    if (status !== "loading") {
      setIsLoaded(true);
    }
  }, [status]);

  useEffect(() => {
    const LOADER_DURATION = 1800;
    
    const timer = setTimeout(() => {
      setLoaderAnimationComplete(true);
    }, LOADER_DURATION);

    return () => clearTimeout(timer);
  }, []);

  const { toastMessage } = useAuthToast();
  const isMobile = useIsMobile();

  if (!isLoaded || !loaderAnimationComplete) {
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

      {toastMessage && <Toast message={toastMessage} />}
    </>
  );
}