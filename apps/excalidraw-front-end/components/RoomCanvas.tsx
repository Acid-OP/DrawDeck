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
        setIsRoomAccessible(false); 

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

    setRoomFullError(null);
    setConnectionError(null);
    setIsRoomAccessible(false);
    setSocket(null);

    window.location.reload();
  };

 if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-4">
        <div className="bg-[#232329] text-white w-full max-w-md p-8 rounded-2xl shadow-2xl border border-[#333] animate-in fade-in duration-300">
          <div className="text-center">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">!</span>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-red-400">
              Connection Failed
            </h2>

            <p className="text-white/80 text-base leading-relaxed mb-6">
              {connectionError}
            </p>

            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
              <p className="text-sm text-red-300 leading-relaxed">
                💡 <span className="font-medium">Tip:</span> Check your internet connection and try again. 
                If the problem persists, the server might be temporarily unavailable.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/25"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }


  if (isConnecting || !socket || !isRoomAccessible) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-4">
        <div className="bg-[#232329] text-white w-full max-w-md p-8 rounded-2xl shadow-2xl border border-[#333] animate-in fade-in duration-300">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-[#9e9aea]/20 rounded-full"></div>
              <div className="absolute inset-2 border-4 border-transparent border-t-[#9e9aea] rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-[#9e9aea]/30 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-[#9e9aea] rounded-full animate-pulse"></div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3" style={{ color: "#9e9aea" }}>
              Connecting to Room
            </h2>

            <p className="text-white/80 text-base leading-relaxed mb-2">
              Joining "{slug}"...
            </p>
            
            <p className="text-white/60 text-sm mb-6">
              Establishing secure connection...
            </p>

            {roomType && (
              <div className="bg-[#9e9aea]/10 border border-[#9e9aea]/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-[#9e9aea]">
                  <span className="text-lg">
                    {roomType === 'duo' ? '👥' : '👨‍👩‍👧‍👦'}
                  </span>
                  <span className="font-medium">
                    {roomType === 'duo' ? 'Duo Room (Max 2 people)' : 'Group Room (Unlimited)'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 text-left">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white/70">Connecting to server...</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                <span className="text-white/50">Authenticating room access...</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                <span className="text-white/50">Loading canvas...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="relative w-full h-full">
      <Canvas roomId={slug} socket={socket} encryptionKey={encryptionKey} roomType= {roomType} />
      {shouldShowVideoCall && ( 
        <VideoCall roomId={slug} />
      )}
    </div>
  );
}