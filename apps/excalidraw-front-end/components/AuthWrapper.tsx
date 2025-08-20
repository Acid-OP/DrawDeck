"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import LoaderAnimation from "./Loader";
import { ShareLinkModal } from "./modal/SharelinkModal";
import { RoomCanvas } from "./RoomCanvas";
import AuthModal from "./AuthModal";

interface AuthWrapperProps {
  roomId: string;
  encryptionKey: string;
  roomType: "duo" | "group";
}

export function AuthWrapper({
  roomId,
  encryptionKey,
  roomType,
}: AuthWrapperProps) {
  const [supabase] = useState(() => createClient());

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 2_300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setIsSignedIn(!!session);
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (isLoaded && minTimeElapsed && !isSignedIn) {
      setShowAuthModal(true);
    }
  }, [isLoaded, minTimeElapsed, isSignedIn]);

  if (!isLoaded || !minTimeElapsed) return <LoaderAnimation />;

  return (
    <>
      {isSignedIn ? (
        <>
          <ShareLinkModal
            roomId={roomId}
            encryptionKey={encryptionKey}
            roomType={roomType}
            isManualTrigger={false}
          />
          <RoomCanvas
            slug={roomId}
            encryptionKey={encryptionKey}
            roomType={roomType}
          />
        </>
      ) : (
        <AuthModal isOpen={showAuthModal} />
      )}
    </>
  );
}