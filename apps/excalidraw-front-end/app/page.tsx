"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Canvas } from "@/components/Canvas";
import LoaderAnimation from "@/components/Loader";
import Toast from "@/components/Toast";
import { useAuthToast } from "@/hooks/useAuthToast";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function HomePage() {
  const [supabase] = useState(() => createClient());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const MIN_LOADING_TIME = 2_300;
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setIsSignedIn(!!data.session);
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsSignedIn(!!session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

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
