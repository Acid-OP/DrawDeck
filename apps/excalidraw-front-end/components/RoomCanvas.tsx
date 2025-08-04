'use client';

import { useEffect, useState } from 'react';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { RoomFullModal } from './modal/RoomfullModal';
import { VideoCall } from './VideoCall';

export function RoomCanvas({ slug, encryptionKey, roomType: propRoomType }: { slug: string; encryptionKey: string; roomType?: 'duo' | 'group' }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [roomFullError, setRoomFullError] = useState<{
    message: string;
    maxCapacity: number;
    currentCount: number;
  } | null>(null);
  const [isRoomAccessible, setIsRoomAccessible] = useState(false); // New state to track room accessibility

  const roomTypeFromStorage = typeof window !== 'undefined' 
    ? sessionStorage.getItem(`roomType-${slug}`) as 'duo' | 'group' | null
    : null;
  
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
        console.log(`🔌 Connecting to room "${slug}" with key...`);
        setIsConnecting(true);
        setConnectionError(null);
        setRoomFullError(null);
        setIsRoomAccessible(false); // Reset accessibility

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          const isCreator = sessionStorage.getItem(`creator-${slug}`) === 'true';
          
          console.log(`👤 User role: ${isCreator ? 'Creator' : 'Participant'}`);

          const payload = isCreator
            ? { type: 'create_room', roomId: slug, encryptionKey, roomType }
            : { type: 'join-room', roomId: slug, encryptionKey }; 

          console.log(payload.encryptionKey);
          ws.send(JSON.stringify(payload));
          setSocket(ws);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const { type, ...rest } = data;

          console.log("📨 WS message received:", data);

          switch (type) {
            case 'room_created':
              console.log(`✅ Room created: "${rest.roomId}" by user ${rest.userId}`);
              setIsRoomAccessible(true); // Allow access when room is created
              setIsConnecting(false);
              break;

            case 'joined_successfully':
              console.log(`🙌 Joined room "${rest.roomId}" as user ${rest.userId}`);
              setIsRoomAccessible(true); // Allow access when successfully joined
              setIsConnecting(false);
              break;

            case 'room_full':
              console.error(`🚫 Room is full: ${rest.message}`);
              setRoomFullError({
                message: rest.message,
                maxCapacity: rest.maxCapacity,
                currentCount: rest.currentCount,
              });
              setIsRoomAccessible(false); // Prevent access when room is full
              setIsConnecting(false);
              // Don't set socket to prevent any canvas rendering
              if (ws) {
                ws.close();
              }
              break;

            case 'user_joined':
              console.log(`👤 User ${rest.userId} joined room "${rest.roomId}"`);
              console.log(`👥 Total participants: ${rest.participantCount}`);
              break;

            case 'user_left':
              console.log(`👋 User ${rest.userId} left room "${rest.roomId}"`);
              console.log(`👥 Remaining participants: ${rest.participantCount}`);
              break;

            case 'shape_added':
              console.log(`➕ Shape added by ${rest.userId} (ID: ${rest.shape?.id})`);
              break;

            case 'shape_updated':
              console.log(`✏️ Shape updated by ${rest.userId} (ID: ${rest.shape?.id})`);
              break;

            case 'shape_deleted':
              console.log(`❌ Shape deleted by ${rest.userId} (ID: ${rest.shapeId})`);
              break;

            case 'error':
              console.error(`🚨 Server error: ${rest.message}`);
              setConnectionError(rest.message || 'Server error occurred');
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
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          setSocket(null);
          setIsConnecting(false);
          setIsRoomAccessible(false);
          
          if (event.code !== 1000 && !roomFullError) {
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
        console.log('🚪 Leaving room...');
        socket.send(JSON.stringify({ type: 'leave_room', roomId: slug }));
        socket.close(1000, 'Component unmounting');
      }
    };
  }, [slug, encryptionKey, roomType]); 

  const handleGoBack = () => {
    setRoomFullError(null);
    window.history.back();
  };

  const handleTryAgain = () => {
    // Reset states and try reconnecting
    setRoomFullError(null);
    setConnectionError(null);
    setIsRoomAccessible(false);
    setSocket(null);
    
    // Trigger reconnection by updating a dependency or calling connectWebSocket again
    // Since we're in useEffect dependency, we can reload or trigger re-render
    window.location.reload();
  };

  // Show room full modal first - prevent any canvas access
  if (roomFullError) {
    return (
      <div className="relative w-full h-full">
        <RoomFullModal
          isOpen={true}
          onClose={() => {}} // Don't allow closing without action
          roomFullError={roomFullError}
          onGoBack={handleGoBack}
          onTryAgain={handleTryAgain}
        />
      </div>
    );
  }

  // Show connection error
  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">❌ {connectionError}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isConnecting || !socket || !isRoomAccessible) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Connecting to room "{slug}"...</p>
          <p className="text-sm text-gray-500 mt-2">Establishing secure connection...</p>
          {roomType && (
            <p className="text-sm text-blue-600 mt-1">
              {roomType === 'duo' ? '👥 Duo Room (Max 2 people)' : '👨‍👩‍👧‍👦 Group Room (Unlimited)'}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Only render canvas and video call when room is accessible and socket is available
  return (
    <div className="relative w-full h-full">
      <Canvas roomId={slug} socket={socket} encryptionKey={encryptionKey} />
      {shouldShowVideoCall && ( 
        <VideoCall roomId={slug} />
      )}
    </div>
  );
}