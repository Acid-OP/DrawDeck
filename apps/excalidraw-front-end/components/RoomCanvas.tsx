'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { VideoCall } from './VideoCall';

export function RoomCanvas({ slug }: { slug: string }) {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const connectWebSocket = async () => {
    if (!slug) return;

    setIsConnecting(true);
    setConnectionError(null);

    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      reconnectAttemptRef.current = 0;
      ws.send(JSON.stringify({ type: 'join_room', roomName: slug }));
      setIsConnecting(false);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    };

    ws.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
      setConnectionError('Failed to connect to room');
      setIsConnecting(false);
    };

    ws.onclose = (event) => {
      console.warn('🔌 WebSocket closed:', event.code, event.reason);
      socketRef.current = null;
      setIsConnecting(false);

     
      if (event.code === 4001) {
        setConnectionError('Authentication failed. Please refresh the page.');
        return;
      } else if (event.code === 4002) {
        setConnectionError('Invalid session. Please sign in again.');
        return;
      }

     
      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    if (reconnectTimeoutRef.current) return;

    const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, 16000);

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      reconnectAttemptRef.current += 1;
      connectWebSocket();
    }, delay);
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'leave_room', roomName: slug }));
        socketRef.current.close();
      }
    };
  }, [slug, getToken]);

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

  if (isConnecting || !socketRef.current) {
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
      <Canvas roomName={slug} socket={socketRef.current} />
      <VideoCall roomName={slug} />
    </div>
  );
}