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
  const MIN_LOADING_TIME = 2_300;
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";

  // handle loading state
  useEffect(() => {
    if (status !== "loading") {
      setIsLoaded(true);
    }
  }, [status]);

  // enforce minimum loader time
  useEffect(() => {
    const t = setTimeout(() => setMinTimeElapsed(true), MIN_LOADING_TIME);
    return () => clearTimeout(t);
  }, []);

  const { toastMessage } = useAuthToast();
  const isMobile = useIsMobile();

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

      {toastMessage && <Toast message={toastMessage} />}
    </>
  );
}
