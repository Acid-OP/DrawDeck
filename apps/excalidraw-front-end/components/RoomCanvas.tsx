'use client';

import { useEffect, useState } from 'react';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { VideoCall } from './VideoCall';

export function RoomCanvas({ slug, encryptionKey }: { slug: string; encryptionKey: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

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

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          const isCreator = sessionStorage.getItem(`creator-${slug}`) === 'true';
          
          console.log(`👤 User role: ${isCreator ? 'Creator' : 'Participant'}`);

          const payload = isCreator
            ? { type: 'create_room', roomId: slug, encryptionKey }
            : { type: 'join-room', roomId: slug, encryptionKey }; 

          console.log(payload.encryptionKey);
          ws.send(JSON.stringify(payload));
          setSocket(ws);
          setIsConnecting(false);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const { type, ...rest } = data;

          console.log("📨 WS message received:", data);

          switch (type) {
            case 'room_created':
              console.log(`✅ Room created: "${rest.roomId}" by user ${rest.userId}`);
              break;

            case 'joined_successfully':
              console.log(`🙌 Joined room "${rest.roomId}" as user ${rest.userId}`);
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
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);
          setSocket(null);
          setIsConnecting(false);
          
          // Only show error if it wasn't a clean close
          if (event.code !== 1000) {
            setConnectionError('Disconnected from room');
          }
        };
      } catch (error) {
        console.error('❌ Connection error:', error);
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
        setIsConnecting(false);
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
  }, [slug, encryptionKey]); // Added encryptionKey to dependencies

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

  if (isConnecting || !socket) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Connecting to room "{slug}"...</p>
          <p className="text-sm text-gray-500 mt-2">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Canvas roomId={slug} socket={socket} />
      {/* Uncomment when ready: */}
      {/* <VideoCall roomName={slug} /> */}
    </div>
  );
}