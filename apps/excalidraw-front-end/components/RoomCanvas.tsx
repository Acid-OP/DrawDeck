'use client';

import { useEffect, useState } from 'react';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { VideoCall } from './VideoCall';

export function RoomCanvas({ slug }: { slug: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const connectWebSocket = async () => {
      try {
        setIsConnecting(true);
        setConnectionError(null);

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          const isCreator = sessionStorage.getItem(`creator-${slug}`) === 'true';

          const payload = isCreator
            ? { type: 'create_room', roomId: slug }
            : { type: 'join-room', roomId: slug };

          ws.send(JSON.stringify(payload));
          setSocket(ws);
          setIsConnecting(false);
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
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
          setConnectionError('Disconnected from room');
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
        socket.send(JSON.stringify({ type: 'leave_room', roomId: slug }));
        socket.close();
      }
    };
  }, [slug]);

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="p-6 text-center">
          <div className="text-red-600 mb-4">❌ {connectionError}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
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
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Canvas roomId={slug} socket={socket} />
      <VideoCall roomName={slug} />
    </div>
  );
}
