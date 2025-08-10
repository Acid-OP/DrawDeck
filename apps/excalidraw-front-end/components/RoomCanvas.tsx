'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { RoomFullModal } from './modal/RoomfullModal';
import { VideoCall } from './VideoCall';

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
  const [isRoomAccessible, setIsRoomAccessible] = useState(false); 

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
    router.push('/');
  };

  const handleTryAgain = () => {
    setRoomFullError(null);
    setConnectionError(null);
    setIsRoomAccessible(false);
    setSocket(null);
    window.location.reload();
  };

  // Show creator left error UI
  if (connectionError && connectionError.includes('creator')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-3">
        <div className="bg-[#232329] text-white w-full max-w-md p-6 rounded-xl shadow-xl border border-[#333] animate-in fade-in duration-300">
          <div className="text-center">
            {/* Creator Left Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-purple-500/20 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 bg-purple-500/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-purple-400">
              Creator Has Left
            </h2>

            <p className="text-white/80 text-base leading-relaxed mb-4">
              The room creator has left the session. This room is no longer accessible.
            </p>

            {/* Room Details */}
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-2xl">👑</span>
                <div className="text-left">
                  <p className="text-purple-300 font-medium text-sm">
                    Room Creator Left
                  </p>
                  <p className="text-white/70 text-xs">
                    Room: "{slug}"
                  </p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg px-3 py-2">
                <p className="text-white/60 text-xs mb-1">Room Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-red-400 font-medium text-sm">Inactive</p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mb-6">
              <p className="text-xs text-amber-300 leading-relaxed">
                ℹ️ <span className="font-medium">Note:</span> 
                When the room creator leaves, the room becomes inaccessible to maintain security and prevent orphaned sessions.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGoBack}
                className="w-full bg-purple-500 text-white cursor-pointer px-4 py-2.5 rounded-lg hover:bg-purple-600 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-purple-500/25 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Home
              </button>
              
              <p className="text-white/50 text-xs">
                You can create a new room or join an existing one from the home page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show room full error UI
  if (roomFullError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-3">
        <div className="bg-[#232329] text-white w-full max-w-md p-6 rounded-xl shadow-xl border border-[#333] animate-in fade-in duration-300">
          <div className="text-center">
            {/* Room Full Icon */}
            <div className="w-16 h-16 mx-auto mb-6 bg-orange-500/20 rounded-full flex items-center justify-center">
              <div className="w-10 h-10 bg-orange-500/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-3 text-orange-400">
              Room is Full
            </h2>

            <p className="text-white/80 text-base leading-relaxed mb-4">
              {roomFullError.message}
            </p>

            {/* Room Details */}
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <span className="text-2xl">
                  {roomType === 'duo' ? '👥' : '👨‍👩‍👧‍👦'}
                </span>
                <div className="text-left">
                  <p className="text-orange-300 font-medium text-sm">
                    {roomType === 'duo' ? 'Duo Room' : 'Group Room'}
                  </p>
                  <p className="text-white/70 text-xs">
                    Room: "{slug}"
                  </p>
                </div>
              </div>
              
              <div className="flex justify-center items-center gap-4 text-sm">
                <div className="bg-white/10 rounded-lg px-3 py-2">
                  <p className="text-white/60 text-xs">Current</p>
                  <p className="text-white font-bold text-lg">{roomFullError.currentCount}</p>
                </div>
                <div className="text-white/40">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="bg-orange-500/20 rounded-lg px-3 py-2">
                  <p className="text-orange-300 text-xs">Maximum</p>
                  <p className="text-orange-400 font-bold text-lg">{roomFullError.maxCapacity}</p>
                </div>
              </div>
            </div>

            {/* Suggestion Box */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3 mb-6">
              <p className="text-xs text-blue-300 leading-relaxed">
                💡 <span className="font-medium">Suggestion:</span> 
                {roomType === 'duo' 
                  ? " Wait for someone to leave or create a new duo room."
                  : " Try creating a new group room or wait for participants to leave."
                }
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleGoBack}
                className="flex-1 bg-gray-600 text-white cursor-pointer px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Go Back
              </button>
              
              <button
                onClick={handleTryAgain}
                className="flex-1 bg-orange-500 text-white cursor-pointer px-4 py-2.5 rounded-lg hover:bg-orange-600 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-orange-500/25 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-3">
        <div className="bg-[#232329] text-white w-full max-w-sm p-6 rounded-xl shadow-xl border border-[#333] animate-in fade-in duration-300">
          <div className="text-center">
            {/* Error Icon */}
            <div className="w-12 h-12 mx-auto mb-5 bg-red-500/20 rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">!</span>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-2 text-red-400">
              Connection Failed
            </h2>

            <p className="text-white/80 text-sm leading-relaxed mb-5">
              {connectionError}
            </p>

            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-6">
              <p className="text-xs text-red-300 leading-relaxed">
                💡 <span className="font-medium">Tip:</span> Check your internet connection and try again.
                If the problem persists, the server might be temporarily unavailable.
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-500 text-white cursor-pointer px-5 py-2.5 rounded-md hover:bg-red-600 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-red-500/25 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1f] via-[#232329] to-[#2a2a35] flex items-center justify-center p-3">
        <div className="bg-[#232329] text-white w-full max-w-sm p-6 rounded-xl shadow-xl border border-[#333] animate-in fade-in duration-300">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-5 relative">
              <div className="absolute inset-0 bg-[#9e9aea]/20 rounded-full"></div>
              <div className="absolute inset-1.5 border-[3px] border-transparent border-t-[#9e9aea] rounded-full animate-spin"></div>
              <div className="absolute inset-3 bg-[#9e9aea]/30 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#9e9aea] rounded-full animate-pulse"></div>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: "#9e9aea" }}>
              Connecting to Room
            </h2>

            <p className="text-white/80 text-sm leading-relaxed mb-1">
              Joining "{slug}"...
            </p>
            
            <p className="text-white/60 text-xs mb-5">
              Establishing secure connection...
            </p>

            {roomType && (
              <div className="bg-[#9e9aea]/10 border border-[#9e9aea]/20 rounded-md p-3 mb-5">
                <div className="flex items-center justify-center gap-2 text-[#9e9aea] text-sm">
                  <span className="text-base">
                    {roomType === 'duo' ? '👥' : '👨‍👩‍👧‍👦'}
                  </span>
                  <span className="font-medium">
                    {roomType === 'duo' ? 'Duo Room (Max 2 people)' : 'Group Room (Unlimited)'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white/70">Connecting to server...</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                <span className="text-white/50">Authenticating room access...</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-1.5 h-1.5 bg-white/30 rounded-full"></div>
                <span className="text-white/50">Loading canvas...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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