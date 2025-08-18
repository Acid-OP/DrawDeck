'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { VideoCall } from './VideoCall';
import { RoomConnecting } from './errors/RoomConnecting';
import { ConnectionError } from './errors/ConnectionError';
import { RoomFullError } from './errors/RoomFullError';
import { CreatorLeftError } from './errors/CreatorLeftError';
interface RateLimitState {
  messagesRemaining: number;
  lastReset: number;
  isBlocked: boolean;
  blockUntil: number;
  retryAfter: number;
}

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

  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    messagesRemaining: 50, 
    lastReset: Date.now(),
    isBlocked: false,
    blockUntil: 0,
    retryAfter: 0
  });

  const connectionAttemptsRef = useRef(0);
  const lastConnectionAttemptRef = useRef(0);
  const connectionBlockedUntilRef = useRef(0);

  const messageQueueRef = useRef<Array<{ message: string; timestamp: number; priority?: number }>>([]);
  const messageQueueTimerRef = useRef<NodeJS.Timeout | null>(null);

  const roomTypeFromStorage = typeof window !== 'undefined' 
    ? sessionStorage.getItem(`roomType-${slug}`) as 'duo' | 'group' | null
    : null;
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  const roomType = propRoomType;
  const shouldShowVideoCall = roomType === 'duo';

  const checkClientRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const windowSize = 60 * 1000; 

    if (now - rateLimitState.lastReset >= windowSize) {
      setRateLimitState(prev => ({
        ...prev,
        messagesRemaining: 50,
        lastReset: now,
        isBlocked: false,
        blockUntil: 0
      }));
      return true;
    }

    if (rateLimitState.isBlocked && now < rateLimitState.blockUntil) {
      return false;
    }

    if (rateLimitState.isBlocked && now >= rateLimitState.blockUntil) {
      setRateLimitState(prev => ({
        ...prev,
        isBlocked: false,
        blockUntil: 0,
        retryAfter: 0
      }));
    }

    return rateLimitState.messagesRemaining > 0 && !rateLimitState.isBlocked;
  }, [rateLimitState]);
  
  const sendMessage = useCallback((message: any, priority: number = 0): boolean => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Socket not ready, message queued');
      messageQueueRef.current.push({ 
        message: JSON.stringify(message), 
        timestamp: Date.now(),
        priority
      });
      messageQueueRef.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return false;
    }
  
    if (!checkClientRateLimit()) {
    console.warn('⚠️ Client-side rate limit exceeded, message queued');
    alert(`⚠️ You're drawing too fast!\n\nYour shapes are being saved automatically, but please slow down a bit.\n\nRefresh the page if drawings seem delayed.`);
  
    messageQueueRef.current.push({ 
      message: JSON.stringify(message), 
      timestamp: Date.now(),
      priority
    });
    messageQueueRef.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return false;
  }
    try {
      socket.send(JSON.stringify(message));
      setRateLimitState(prev => ({
        ...prev,
        messagesRemaining: Math.max(0, prev.messagesRemaining - 1)
      }));
    
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      return false;
    }
  }, [socket, checkClientRateLimit]);
  
  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0 || !socket || socket.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    messageQueueRef.current = messageQueueRef.current.filter(item => 
      now - item.timestamp < 5 * 60 * 1000
    );

    if (checkClientRateLimit() && rateLimitState.messagesRemaining > 0) {
      const messagesToProcess = messageQueueRef.current.splice(0, 
        Math.min(rateLimitState.messagesRemaining, 3)
      );
      messagesToProcess.forEach(({ message }) => {
        try {
          socket.send(message);
          setRateLimitState(prev => ({
            ...prev,
            messagesRemaining: Math.max(0, prev.messagesRemaining - 1)
          }));
        } catch (error) {
          console.error('❌ Failed to send queued message:', error);
        }
      });

      if (messagesToProcess.length > 0) {
        console.log(`✅ Processed ${messagesToProcess.length} queued messages`);
      }
    }
  }, [socket, checkClientRateLimit, rateLimitState.messagesRemaining]);

  useEffect(() => {
    if (messageQueueTimerRef.current) {
      clearInterval(messageQueueTimerRef.current);
    }
    messageQueueTimerRef.current = setInterval(processMessageQueue, 2000);
    return () => {
      if (messageQueueTimerRef.current) {
        clearInterval(messageQueueTimerRef.current);
      }
    };
  }, [processMessageQueue]);

  const checkConnectionAttempts = useCallback((): boolean => {
    const now = Date.now();
    const connectionWindow = 5 * 60 * 1000; 
    const maxAttempts = 15; 

    if (now - lastConnectionAttemptRef.current >= connectionWindow) {
      connectionAttemptsRef.current = 0;
    }

    if (now < connectionBlockedUntilRef.current) {
      const remainingTime = Math.ceil((connectionBlockedUntilRef.current - now) / 1000);
      setConnectionError(`Too many connection attempts. Please wait ${remainingTime}s.`);
      return false;
    }

    connectionAttemptsRef.current++;
    lastConnectionAttemptRef.current = now;

    if (connectionAttemptsRef.current > maxAttempts) {
      connectionBlockedUntilRef.current = now + (10 * 60 * 1000); 
      setConnectionError('Too many connection attempts. Please wait 10 minutes.');
      return false;
    }

    return true;
  }, []);

  useEffect(() => {
    if (!slug || !encryptionKey) {
      console.error('❌ Missing slug or encryptionKey');
      setConnectionError('Missing room parameters');
      return;
    }

    const connectWebSocket = async () => {
      if (!checkConnectionAttempts()) {
        return;
      }
      try {
        setIsConnecting(true);
        setConnectionError(null);
        setRoomFullError(null);
        setCreatorLeftError(false);
        setIsRoomAccessible(false);

        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          connectionAttemptsRef.current = 0;
          connectionBlockedUntilRef.current = 0;

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
            case 'rate_limit_exceeded':
              console.warn('⚠️ Server rate limit exceeded:', rest.message);
              const retryAfter = (rest.retryAfter || 60) * 1000;
              setRateLimitState(prev => ({
                ...prev,
                isBlocked: true,
                blockUntil: Date.now() + retryAfter,
                retryAfter: retryAfter,
                messagesRemaining: 0
              }));
              break;

            case 'room_created':
              setIsRoomAccessible(true);
              setIsConnecting(false);
              setRateLimitState(prev => ({
                ...prev,
                messagesRemaining: 50, 
                lastReset: Date.now()
              }));
              break;

            case 'joined_successfully':
              setIsRoomAccessible(true); 
              setIsConnecting(false);
              setRateLimitState(prev => ({
                ...prev,
                messagesRemaining: 49, 
                lastReset: Date.now()
              }));
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
              } else if (rest.message && (rest.message.includes('rate limit') || rest.message.includes('Too many messages'))) {
                setRateLimitState(prev => ({
                  ...prev,
                  isBlocked: true,
                  blockUntil: Date.now() + 60000,
                  retryAfter: 60000,
                  messagesRemaining: 0
                }));
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
      if (messageQueueTimerRef.current) {
        clearInterval(messageQueueTimerRef.current);
      }
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'leave_room', roomId: slug }));
        socket.close(1000, 'Component unmounting');
      }
    };
  }, [slug, encryptionKey, roomType, checkConnectionAttempts]); 

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

    setRateLimitState({
      messagesRemaining: 50,
      lastReset: Date.now(),
      isBlocked: false,
      blockUntil: 0,
      retryAfter: 0
    });

    connectionAttemptsRef.current = 0;
    connectionBlockedUntilRef.current = 0;

    messageQueueRef.current = [];
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
      <Canvas 
        roomId={slug} 
        socket={socket} 
        encryptionKey={encryptionKey} 
        roomType={roomType}
        sendMessage={sendMessage} 
        rateLimitState={rateLimitState}
        connectionError={connectionError}
        roomFullError={roomFullError}
        creatorLeftError={creatorLeftError}
        isConnecting={isConnecting}
        isRoomAccessible={isRoomAccessible}
      />
      {shouldShowVideoCall && ( 
        <VideoCall roomId={slug} />
      )}
    </div>
  )};