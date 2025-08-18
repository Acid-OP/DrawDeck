'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { WS_URL } from '@/config';
import { Canvas } from './Canvas';
import { RoomFullModal } from './modal/RoomfullModal';
import { VideoCall } from './VideoCall';
import { RoomConnecting } from './errors/RoomConnecting';
import { ConnectionError } from './errors/ConnectionError';
import { RoomFullError } from './errors/RoomFullError';
import { CreatorLeftError } from './errors/CreatorLeftError';

// Rate limiting state interface
interface RateLimitState {
  messagesRemaining: number;
  lastReset: number;
  isBlocked: boolean;
  blockUntil: number;
  retryAfter: number;
}

// Rate limit notification component
const RateLimitNotification = ({ 
  messagesRemaining, 
  isBlocked, 
  retryAfter 
}: { 
  messagesRemaining: number; 
  isBlocked: boolean; 
  retryAfter: number;
}) => {
  if (!isBlocked && messagesRemaining > 10) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
      isBlocked 
        ? 'bg-red-100 border border-red-400 text-red-700' 
        : 'bg-yellow-100 border border-yellow-400 text-yellow-700'
    }`}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          {isBlocked ? (
            <>
              <div className="font-semibold text-sm">Rate Limited</div>
              <div className="text-xs mt-1">
                Too many actions. Please wait {Math.ceil(retryAfter / 1000)}s
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold text-sm">Approaching Limit</div>
              <div className="text-xs mt-1">
                {messagesRemaining} actions remaining
              </div>
            </>
          )}
        </div>
        <div className="w-2 h-2 rounded-full bg-current opacity-75 animate-pulse"></div>
      </div>
    </div>
  );
};

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

  // Rate limiting state
  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    messagesRemaining: 50, // Default max messages from backend
    lastReset: Date.now(),
    isBlocked: false,
    blockUntil: 0,
    retryAfter: 0
  });

  // Connection attempt tracking
  const connectionAttemptsRef = useRef(0);
  const lastConnectionAttemptRef = useRef(0);
  const connectionBlockedUntilRef = useRef(0);

  // Message queue for when rate limited
  const messageQueueRef = useRef<Array<{ message: string; timestamp: number; priority?: number }>>([]);
  const messageQueueTimerRef = useRef<NodeJS.Timeout | null>(null);

  const roomTypeFromStorage = typeof window !== 'undefined' 
    ? sessionStorage.getItem(`roomType-${slug}`) as 'duo' | 'group' | null
    : null;
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

  const roomType = propRoomType;
  const shouldShowVideoCall = roomType === 'duo';

  // Client-side rate limit checking
  const checkClientRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute window
    
    // Reset if window has passed
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

    // Check if still blocked
    if (rateLimitState.isBlocked && now < rateLimitState.blockUntil) {
      return false;
    }

    // Unblock if time has passed
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

  // Enhanced message sending with rate limiting and priority queue
  const sendMessage = useCallback((message: any, priority: number = 0): boolean => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Socket not ready, message queued');
      messageQueueRef.current.push({ 
        message: JSON.stringify(message), 
        timestamp: Date.now(),
        priority
      });
      // Sort by priority (higher priority first)
      messageQueueRef.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return false;
    }

    // Check client-side rate limit first
    if (!checkClientRateLimit()) {
      console.warn('⚠️ Client-side rate limit exceeded, message queued');
      messageQueueRef.current.push({ 
        message: JSON.stringify(message), 
        timestamp: Date.now(),
        priority
      });
      // Sort by priority
      messageQueueRef.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      return false;
    }

    try {
      socket.send(JSON.stringify(message));
      
      // Update local rate limit state
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

  // Process queued messages with priority
  const processMessageQueue = useCallback(() => {
    if (messageQueueRef.current.length === 0 || !socket || socket.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    
    // Remove expired messages (older than 5 minutes)
    messageQueueRef.current = messageQueueRef.current.filter(item => 
      now - item.timestamp < 5 * 60 * 1000
    );

    // Process messages if not rate limited
    if (checkClientRateLimit() && rateLimitState.messagesRemaining > 0) {
      const messagesToProcess = messageQueueRef.current.splice(0, 
        Math.min(rateLimitState.messagesRemaining, 3) // Process max 3 at once to avoid overwhelming
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

  // Set up message queue processor
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

  // Check connection attempts before connecting
  const checkConnectionAttempts = useCallback((): boolean => {
    const now = Date.now();
    const connectionWindow = 5 * 60 * 1000; // 5 minutes
    const maxAttempts = 15; // Match backend settings

    // Reset if window has passed
    if (now - lastConnectionAttemptRef.current >= connectionWindow) {
      connectionAttemptsRef.current = 0;
    }

    // Check if blocked
    if (now < connectionBlockedUntilRef.current) {
      const remainingTime = Math.ceil((connectionBlockedUntilRef.current - now) / 1000);
      setConnectionError(`Too many connection attempts. Please wait ${remainingTime}s.`);
      return false;
    }

    connectionAttemptsRef.current++;
    lastConnectionAttemptRef.current = now;

    if (connectionAttemptsRef.current > maxAttempts) {
      connectionBlockedUntilRef.current = now + (10 * 60 * 1000); // 10 minute block
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
      // Check connection rate limiting
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
          // Reset connection attempts on successful connection
          connectionAttemptsRef.current = 0;
          connectionBlockedUntilRef.current = 0;

          const isCreator = sessionStorage.getItem(`creator-${slug}`) === 'true';
          const payload = isCreator
            ? { type: 'create_room', roomId: slug, encryptionKey, roomType }
            : { type: 'join-room', roomId: slug, encryptionKey }; 
          
          // Use sendMessage for initial connection message with high priority
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
              // Reset rate limit on successful room creation
              setRateLimitState(prev => ({
                ...prev,
                messagesRemaining: 49, // Used one for room creation
                lastReset: Date.now()
              }));
              break;

            case 'joined_successfully':
              setIsRoomAccessible(true); 
              setIsConnecting(false);
              // Reset rate limit on successful join
              setRateLimitState(prev => ({
                ...prev,
                messagesRemaining: 49, // Used one for joining
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
                // Handle rate limit errors
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
        // High priority for disconnect message
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
    // Reset rate limiting state
    setRateLimitState({
      messagesRemaining: 50,
      lastReset: Date.now(),
      isBlocked: false,
      blockUntil: 0,
      retryAfter: 0
    });
    // Clear connection attempts
    connectionAttemptsRef.current = 0;
    connectionBlockedUntilRef.current = 0;
    // Clear message queue
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
      <RateLimitNotification 
        messagesRemaining={rateLimitState.messagesRemaining}
        isBlocked={rateLimitState.isBlocked}
        retryAfter={rateLimitState.retryAfter}
      />
      <Canvas 
        roomId={slug} 
        socket={socket} 
        encryptionKey={encryptionKey} 
        roomType={roomType}
        sendMessage={sendMessage} 
        rateLimitState={rateLimitState}
      />
      {shouldShowVideoCall && ( 
        <VideoCall roomId={slug} />
      )}
    </div>
  );
}