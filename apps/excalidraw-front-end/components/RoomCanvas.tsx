'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { RoomFullModal } from './modal/RoomfullModal';
import { VideoCall } from './VideoCall';
import { RoomConnecting } from './errors/RoomConnecting';
import { ConnectionError } from './errors/ConnectionError';
import { RoomFullError } from './errors/RoomFullError';
import { CreatorLeftError } from './errors/CreatorLeftError';

export function RoomCanvas({ slug, encryptionKey, roomType: propRoomType }: { slug: string; encryptionKey: string; roomType?: 'duo' | 'group' }) {
  const router = useRouter();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [roomFullError, setRoomFullError] = useState<{
    message: string;
    maxCapacity: number;
    currentCount: number;
  } | null>(null);
  const [creatorLeftError, setCreatorLeftError] = useState<boolean>(false);
  const [isRoomAccessible, setIsRoomAccessible] = useState(false); 
  const [minDelayElapsed, setMinDelayElapsed] = useState(false);
  const roomTypeFromStorage = typeof window !== 'undefined' 
    ? sessionStorage.getItem(`roomType-${slug}`) as 'duo' | 'group' | null
    : null;
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

  const roomType = propRoomType;
  const shouldShowVideoCall = roomType === 'duo';

  useEffect(() => {
    if (!slug || !encryptionKey) {
      console.error('❌ Missing slug or encryptionKey');
      setConnectionError('Missing room parameters');
      return;
    }

    const connectWebSocket = async () => {
      try {
        setIsConnecting(true);
        setConnectionError(null);
        setRoomFullError(null);
        setCreatorLeftError(false);
        setIsRoomAccessible(false); 

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          const isCreator = sessionStorage.getItem(`creator-${slug}`) === 'true';
          const payload = isCreator
            ? { type: 'create_room', roomId: slug, encryptionKey, roomType }
            : { type: 'join-room', roomId: slug, encryptionKey }; 
          ws.send(JSON.stringify(payload));
          setSocket(ws);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const { type, ...rest } = data;

          switch (type) {
            case 'room_created':
              setIsRoomAccessible(true);
              setIsConnecting(false);
              break;

            case 'joined_successfully':
              setIsRoomAccessible(true); 
              setIsConnecting(false);
              break;

            case 'room_full':
              console.error(`🚫 Room is full: ${rest.message}`);
              setRoomFullError({
                message: rest.message,
                maxCapacity: rest.maxCapacity,
                currentCount: rest.currentCount,
              });
              setIsRoomAccessible(false); 
              setIsConnecting(false);
              if (ws) {
                ws.close();
              }
              break;

            case 'creator_left':
              setCreatorLeftError(true);
              setIsRoomAccessible(false);
              setIsConnecting(false);
              if (ws) {
                ws.close();
              }
              break;

            case 'user_joined':
              break;

            case 'user_left':
              break;

            case 'shape_added':
              break;

            case 'shape_updated':
              break;

            case 'shape_deleted':
              break;

            case 'error':
              console.error(`🚨 Server error: ${rest.message}`);
              if (rest.message && rest.message.includes('does not exist')) {
                setCreatorLeftError(true);
              } else {
                setConnectionError(rest.message || 'Server error occurred');
              }
              setIsRoomAccessible(false);
              break;

            default:
              console.warn('⚠️ Unknown message type received:', type, rest);
              break;
          }
        };

        ws.onerror = (err) => {
          console.error('❌ WebSocket error:', err);
          setConnectionError('WebSocket connection failed');
          setIsConnecting(false);
          setIsRoomAccessible(false);
        };

        ws.onclose = (event) => {
          setSocket(null);
          setIsConnecting(false);
          setIsRoomAccessible(false);
          
          if (event.code !== 1000 && !roomFullError && !creatorLeftError) {
            setConnectionError('Disconnected from room');
          }
        };
      } catch (error) {
        console.error('❌ Connection error:', error);
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
        setIsConnecting(false);
        setIsRoomAccessible(false);
      }
    };

    connectWebSocket();

    return () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'leave_room', roomId: slug }));
        socket.close(1000, 'Component unmounting');
      }
    };
  }, [slug, encryptionKey, roomType]); 

  useEffect(() => {
    const timer = setTimeout(() => setMinDelayElapsed(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleGoBack = () => {
    setRoomFullError(null);
    setCreatorLeftError(false);
    router.push('/');
  };

  const handleTryAgain = () => {
    setRoomFullError(null);
    setConnectionError(null);
    setCreatorLeftError(false);
    setIsRoomAccessible(false);
    setSocket(null);
    window.location.reload();
  };

  if (creatorLeftError) {
    return <CreatorLeftError slug={slug} onGoBack={handleGoBack} />;
  }

  if (roomFullError) {
    return (
      <RoomFullError
        error={roomFullError}
        slug={slug}
        roomType={roomType}
        handleGoBack={handleGoBack}
        handleTryAgain={handleTryAgain}
      />
    );
  }

  if (connectionError) {
    return <ConnectionError error={connectionError}/>;
  }
  if (!minDelayElapsed) return null;
  if (!minDelayElapsed || isConnecting || !socket || !isRoomAccessible) {
    return (
      <>
      <div className="fade-in">
        <RoomConnecting slug={slug} roomType={roomType} />
      </div>
      </>
    )
  }

  return (
    <div className="relative w-full h-full">
      <Canvas roomId={slug} socket={socket} encryptionKey={encryptionKey} roomType={roomType} />
      {shouldShowVideoCall && ( 
        <VideoCall roomId={slug} />
      )}
    </div>
  );
}