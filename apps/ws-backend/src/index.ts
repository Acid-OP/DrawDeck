import { WebSocketServer, WebSocket as WSWebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

type UserSession = {
  authenticated: boolean;
  role: 'creator' | 'participant';
  expires: number;
  clerkUserId: string;
};

type ClientInfo = {
  ws: WSWebSocket;
  userId: string;
  rooms: Set<string>;
  session?: UserSession;
};

type Room = {
  participants: Map<string, ClientInfo>;
  creatorId?: string;
};

const clients = new Set<ClientInfo>();
const rooms: Map<string, Room> = new Map();
const userSessions = new Map<string, UserSession>(); 

import { verifyToken } from '@clerk/backend';

async function verifyClerkToken(token: string): Promise<{ id: string; sessionId?: string } | null> {
  try {
    const verifiedToken = await verifyToken(token, {
      jwtKey: process.env.CLERK_JWT_KEY,
      authorizedParties: [
        'http://localhost:3000', 
        'https://your-domain.com' 
      ]
    });
    
    return {
      id: verifiedToken.sub, 
      sessionId: verifiedToken.sid
    };
  } catch (error) {
    console.error('❌ Clerk token verification failed:', error);
    return null;
  }
}

function isValidSession(userId: string): boolean {
  const session = userSessions.get(userId);
  if (!session) return false;
  if (session.expires < Date.now()) {
    userSessions.delete(userId);
    return false;
  }
  return true;
}

function broadcastToRoom(roomId: string, data: any, exclude?: ClientInfo) {
  const room = rooms.get(roomId);
  if (!room) return;

  const message = JSON.stringify(data);

  for (const [userId, client] of room.participants.entries()) {
    if (client !== exclude && client.ws.readyState === client.ws.OPEN) {
      client.ws.send(message);
    }
  }
}

wss.on("connection", (ws, request) => {
  const dummyUserId = `user_${Math.floor(Math.random() * 10000)}`;
  const client: ClientInfo = {
    ws,
    userId: dummyUserId,
    rooms: new Set(),
  };
  clients.add(client);

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, roomId, shape, shapeId, updatedShape, clerkToken } = data;
      
      switch (type) {
        case "create_room": {
          if (!clerkToken) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Authentication required to create room"
            }));
            return;
          }

          const user = await verifyClerkToken(clerkToken);
          if (!user) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid authentication token"
            }));
            ws.close(1008, 'Authentication failed');
            return;
          }

          const session: UserSession = {
            authenticated: true,
            role: 'creator',
            expires: Date.now() + (24 * 60 * 60 * 1000), 
            clerkUserId: user.id
          };
          
          userSessions.set(client.userId, session);
          client.session = session;

          const newRoom = roomId || `room_${Date.now()}`;
          if (!rooms.has(newRoom)) {
            rooms.set(newRoom, { 
              participants: new Map(),
              creatorId: client.userId
            });
          }
          const room = rooms.get(newRoom)!;
          room.participants.set(client.userId, client);
          client.rooms.add(newRoom);

          ws.send(JSON.stringify({
            type: "room_created",
            roomId: newRoom,
            userId: client.userId,
            role: 'creator'
          }));
          break;
        }

        case "join-room": {
          if (!roomId) return;

          if (!clerkToken) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Authentication required to join room"
            }));
            return;
          }

          const user = await verifyClerkToken(clerkToken);
          if (!user) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid authentication token"
            }));
            ws.close(1008, 'Authentication failed');
            return;
          }

          if (!rooms.has(roomId)) {
            ws.send(JSON.stringify({
              type: "error",
              message: `Room "${roomId}" does not exist.`,
            }));
            return;
          }

          const session: UserSession = {
            authenticated: true,
            role: 'participant',
            expires: Date.now() + (24 * 60 * 60 * 1000), 
            clerkUserId: user.id
          };
          
          userSessions.set(client.userId, session);
          client.session = session;

          const room = rooms.get(roomId)!;
          room.participants.set(client.userId, client);
          client.rooms.add(roomId);

          ws.send(JSON.stringify({
            type: "joined_successfully",
            roomId,
            userId: client.userId,
            role: 'participant'
          }));

          broadcastToRoom(roomId, {
            type: "user_joined",
            userId: client.userId,
            roomId,
            participantCount: room.participants.size,
            timestamp: new Date().toISOString(),
          }, client);
          break;
        }

        case "shape_add": {
          if (!isValidSession(client.userId)) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Session expired or invalid. Please reconnect."
            }));
            return;
          }

          if (!roomId || !shape) return;

          broadcastToRoom(roomId, {
            type: "shape_add",
            roomId,
            userId: client.userId,
            shape,
            timestamp: new Date().toISOString(),
          }, client);
          break;
        }

        case "shape_delete": {
          if (!isValidSession(client.userId)) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Session expired or invalid. Please reconnect."
            }));
            return;
          }

          if (!roomId || !shapeId) return;

          broadcastToRoom(roomId, {
            type: "shape_delete",
            roomId,
            userId: client.userId,
            shapeId,
            timestamp: new Date().toISOString(),
          }, client);
          break;
        }

        case "shape_update": {
          if (!isValidSession(client.userId)) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Session expired or invalid. Please reconnect."
            }));
            return;
          }

          if (!roomId || !updatedShape || !updatedShape.id) return;

          broadcastToRoom(roomId, {
            type: "shape_updated",
            roomId,
            userId: client.userId,
            shape: updatedShape,
            timestamp: new Date().toISOString(),
          }, client);
          break;
        }

        default:
          console.warn("⚠️ Unknown message type:", type);
      }
    } catch (err) {
      console.error("❌ Invalid message format:", raw.toString());
    }
  });

  ws.on("close", () => {
    client.rooms.forEach((roomId) => {
      const room = rooms.get(roomId);
      if (room) {
        room.participants.delete(client.userId);

        broadcastToRoom(roomId, {
          type: "user_left",
          roomId,
          userId: client.userId,
          participantCount: room.participants.size,
          timestamp: new Date().toISOString(),
        });

        const hasOthers = room.participants.size > 0;
        if (!hasOthers) {
          rooms.delete(roomId);
        } 
      }
    });

    userSessions.delete(client.userId);
    clients.delete(client);
  });

  ws.on("error", (error) => {
    console.error(`❌ WebSocket error (user ${client.userId}):`, error);
  });
});

console.log("✅ WebSocket server running at ws://localhost:8080");