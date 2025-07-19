'use client';

import { useEffect, useState } from 'react';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { VideoCall } from './VideoCall';


export function RoomCanvas({ slug }: { slug: string }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token') ?? '';
    setToken(storedToken);
  }, []);

  useEffect(() => {
    if (!slug || !token) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      ws.send(JSON.stringify({ type: 'join_room', roomName: slug }));
      setSocket(ws);
    };

    ws.onerror = (err) => {
      console.error('❌ WebSocket error:', err);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave_room', roomName: slug }));
        ws.close();
      }
    };
  }, [slug, token]);

  if (!socket) return <div className="p-6">Connecting to socket…</div>;

  return (
    <div className="relative w-full h-full">
      <Canvas roomName={slug} socket={socket} />
      <VideoCall roomName={slug} token={token} /> 
    </div>

  );
}
