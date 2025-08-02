"use client";
import { RoomCanvas } from "@/components/RoomCanvas";
import { useParams } from 'next/navigation';
import { ShareLinkModal } from '@/components/modal/SharelinkModal';
import LoaderAnimation from '@/components/Loader';
import { useEffect, useState } from 'react';

export default function CanvasPage() {
  const params = useParams();
  const roomId = params.slug as string;
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 2300);
    return () => clearTimeout(timer);
  }, []);

  if (!minTimeElapsed) {
    return <LoaderAnimation />;
  }

  return (
    <>
      <ShareLinkModal roomId={roomId} />
      <RoomCanvas slug={roomId} />
    </>
  );
}
