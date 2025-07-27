import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { IncomingMessage } from "http";
import { parse } from "cookie";
import dotenv from 'dotenv';
dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

wss.on("listening", () => {
  console.log("✅ WebSocket server is listening on ws://localhost:8080");
});

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
}

const clients: Set<ClientInfo> = new Set();

async function verifyClerkSession(sessionToken: string): Promise<string | null> {
  try {
    try {
      const payload = await clerkClient.verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      return payload.sub; 
    } catch (tokenError) {
      console.log("⚠️ verifyToken failed, trying verifySession...");
    }
    const tokenParts = sessionToken.split('.');
    if (tokenParts.length === 3 && tokenParts[1]) {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      const sessionId = payload.sid;
      
      if (sessionId) {
        const session = await clerkClient.sessions.verifySession(sessionId, sessionToken);
        return session.userId;
      }
    }

    return null;
  } catch (error) {
    console.error("❌ All verification methods failed:", error);
    return null;
  }
}


async function authenticateUser(request: IncomingMessage): Promise<string | null> {
  const cookieHeader = request.headers.cookie;
  console.log('🍪 Raw cookies:', cookieHeader);
  
  if (!cookieHeader) {
    console.log('❌ No cookies found');
    return null;
  }

  const cookies = parse(cookieHeader);
  const sessionToken = cookies['__session']; 
  
  console.log('📝 Session token:', sessionToken ? 'Present' : 'Missing');
  console.log('🔍 Token preview:', sessionToken ? sessionToken.substring(0, 50) + '...' : 'None');
  
  if (!sessionToken) {
    console.log('❌ No __session cookie found');
    console.log('🔍 Available cookies:', Object.keys(cookies));
    return null;
  }

  const userId = await verifyClerkSession(sessionToken);
  console.log('🔐 Verification result:', userId ? `Success: ${userId}` : 'Failed');
  return userId;
}

function broadcastToRoom(roomName: string, payload: unknown) {
  const msg = JSON.stringify(payload);
  clients.forEach((client) => {
    if (client.rooms.has(roomName)) {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(msg);
        }
      } catch (error) {
        clients.delete(client);
      }
    }
  });
}

wss.on("connection", async (ws, request) => {
  const userId = await authenticateUser(request);

  if (!userId) {
    return ws.close(4001, "invalidtoken");
  }

  const client: ClientInfo = { ws, userId, rooms: new Set() };
  clients.add(client);

  ws.on("message", (raw) => {
    let payload: any;
    try {
      payload = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const { type } = payload;

    switch (type) {
      case "join_room": {
        client.rooms.add(String(payload.roomName));
        break;
      }

      case "leave_room": {
        client.rooms.delete(String(payload.roomName));
        break;
      }

      case "shape:add": {
        const { roomName, shape } = payload;
        broadcastToRoom(String(roomName), {
          type: "shape:add",
          roomName,
          shape,
        });
        break;
      }

      case "shape:delete": {
        const { roomName, shapeId } = payload;
        broadcastToRoom(String(roomName), {
          type: "shape:delete",
          roomName,
          shapeId,
        });
        break;
      }

      default: {
        console.warn("Unknown message type:", type);
      }
    }
  });

  ws.on("close", () => {
    clients.delete(client);
  });
});