"use client";
import { useAuth } from '@clerk/nextjs';
import { RoomCanvas } from "@/components/RoomCanvas";
import { useParams, useRouter } from 'next/navigation';
import { ShareLinkModal } from '@/components/modal/SharelinkModal';
import LoaderAnimation from '@/components/Loader';
import { useEffect, useState } from 'react';

export default function CanvasPage() {
  const params = useParams();
  const roomId = params.slug as string;
  return <AuthWrapper roomId={roomId} />;
}

function AuthWrapper({ roomId }: { roomId: string }) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2300);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded || !minTimeElapsed) {
    return <LoaderAnimation />;
  }

  if (!isSignedIn) {
    router.push('/signin');
    return <LoaderAnimation />;
  }

  return (
    <>
      <ShareLinkModal roomId={roomId} />
      <RoomCanvas slug={roomId} />
    </>
  );
}
