'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { VideoCall } from './VideoCall';

export function RoomCanvas({ slug }: { slug: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { getToken } = useAuth(); // Keep only getToken for WS backend

  useEffect(() => {
    if (!slug) return;

    const connectWebSocket = async () => {
      try {
        setIsConnecting(true);
        setConnectionError(null);
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          ws.send(JSON.stringify({ type: 'join_room', roomName: slug }));
          setSocket(ws);
          setIsConnecting(false);
        };

        ws.onerror = (err) => {
          console.error('❌ WebSocket error:', err);
          setConnectionError('Failed to connect to room');
          setIsConnecting(false);
        };

        ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          setSocket(null);
          setIsConnecting(false);
          
          // Handle specific close codes
          if (event.code === 4001) {
            setConnectionError('Authentication failed. Please refresh the page.');
          } else if (event.code === 4002) {
            setConnectionError('Invalid session. Please sign in again.');
          }
        };

        ws.onmessage = (event) => {
          // Handle incoming messages if needed
          const data = JSON.parse(event.data);
          console.log('📨 Received:', data);
        };

      } catch (error) {
        console.error('❌ Failed to connect:', error);
        setConnectionError(error instanceof Error ? error.message : 'Connection failed');
        setIsConnecting(false);
      }
    };

    connectWebSocket();

    return () => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'leave_room', roomName: slug }));
        socket.close();
      }
    };
  }, [slug, getToken]);

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
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show connecting state
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
      <Canvas roomName={slug} socket={socket} />
      <VideoCall roomName={slug} />
    </div>
  );
}