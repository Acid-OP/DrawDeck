"use client";
import { useAuth } from '@clerk/nextjs';
import { RoomCanvas } from "@/components/RoomCanvas";
import { useParams } from 'next/navigation';
import { ShareLinkModal } from '@/components/modal/SharelinkModal';
import LoaderAnimation from '@/components/Loader';
import { useEffect, useState } from 'react';
import AuthModal from '@/components/AuthModal';

export default function CanvasPage() {
  const params = useParams();
  const roomId = params.slug as string;
  return <AuthWrapper roomId={roomId} />;
}

function AuthWrapper({ roomId }: { roomId: string }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLoaded && minTimeElapsed) {
      if (!isSignedIn) {
        setShowAuthModal(true);
      }
    }
  }, [isLoaded, minTimeElapsed, isSignedIn]);

  if (!isLoaded || !minTimeElapsed) {
    return <LoaderAnimation />;
  }

  return (
    <>
      {isSignedIn && (
        <>
          <ShareLinkModal roomId={roomId} />
          <RoomCanvas slug={roomId} />
        </>
      )}

      <AuthModal isOpen={showAuthModal} />
    </>
  );
}