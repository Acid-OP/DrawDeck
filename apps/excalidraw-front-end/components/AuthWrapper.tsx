"use client"
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import LoaderAnimation from "./Loader";
import { ShareLinkModal } from "./modal/SharelinkModal";
import { RoomCanvas } from "./RoomCanvas";
import AuthModal from "./AuthModal";

interface AuthWrapperProps {
  roomId: string;
  encryptionKey: string;
  roomType: 'duo' | 'group';
}

export function AuthWrapper({ roomId, encryptionKey, roomType }: AuthWrapperProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 2300);
    return () => clearTimeout(timer);
  }, []);

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
          <RoomCanvas slug={roomId} encryptionKey={encryptionKey} roomType={roomType} />
        </>
      ) : (
        <AuthModal isOpen={showAuthModal} />
      )}
    </>
  );
}