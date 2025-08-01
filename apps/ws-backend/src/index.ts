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

// Verify Clerk session tokens to authenticate users
async function verifyClerkSession(sessionToken: string): Promise<string | null> {
  try {
    try {
      const payload = await clerkClient.verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      return payload.sub; // userId
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

// Authenticate user from incoming HTTP request's cookie header
async function authenticateUser(request: IncomingMessage): Promise<string | null> {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  const sessionToken = cookies['__session']; // Clerk session cookie
  if (!sessionToken) return null;
  return await verifyClerkSession(sessionToken);
}

// Broadcast payload to all clients in the same room, excluding the sender
function broadcastToRoom(roomName: string, payload: unknown, senderClient?: ClientInfo) {
  const msg = JSON.stringify(payload);
  let broadcastCount = 0;

  clients.forEach(client => {
    if (senderClient && client.userId === senderClient.userId) {
      // Skip sending back to the sender
      return;
    }
    if (client.rooms.has(roomName)) {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(msg);
          broadcastCount++;
          // Log minimal info, can comment out in prod
          console.log(`📤 Sent to client ${client.userId} in room "${roomName}"`);
        }
      } catch (error) {
        console.error(`❌ Failed to send to client ${client.userId}:`, error);
        clients.delete(client); 
      }
    }
  });

  console.log(`📊 Total broadcasts sent: ${broadcastCount} (excluded sender: ${senderClient?.userId})`);
}

// Main WebSocket connection handling
wss.on("connection", async (ws, request) => {
  const userId = await authenticateUser(request);

  if (!userId) {
    console.log("❌ Authentication failed, closing connection");
    return ws.close(4001, "invalidtoken");
  }

  const client: ClientInfo = { ws, userId, rooms: new Set() };
  clients.add(client);

  console.log(`👤 Client connected: ${userId} (Total clients: ${clients.size})`);

  ws.on("message", (raw) => {
    let payload: any;
    try {
      payload = JSON.parse(raw.toString());
    } catch {
      console.error("❌ Failed to parse message:", raw.toString());
      return;
    }

    console.log(`📨 Received message from ${client.userId}:`, {
      type: payload.type,
      roomName: payload.roomName,
    });

    const { type } = payload;

    switch (type) {
      case "test": {
        // Simple echo broadcast to all including sender for testing
        broadcastToRoom(String(payload.roomName), {
          type: "test",
          message: "Hello from server",
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case "join_room": {
        client.rooms.add(String(payload.roomName));
        const roomClients = Array.from(clients).filter(c => c.rooms.has(String(payload.roomName)));
        console.log(`🏠 Client ${client.userId} joined room "${payload.roomName}"`);
        console.log(`📊 Room "${payload.roomName}" now has ${roomClients.length} clients:`, roomClients.map(c => c.userId));
        break;
      }

      case "leave_room": {
        client.rooms.delete(String(payload.roomName));
        console.log(`🚪 Client ${client.userId} left room "${payload.roomName}"`);
        break;
      }

      case "shape:add": {
        const { roomName, shape } = payload;
        console.log(`[SERVER] 🎨 Received shape:add from ${client.userId}`, {
          roomName,
          shapeType: shape?.type,
          shapeId: shape?.id,
          timestamp: new Date().toLocaleTimeString(),
        });

        // Broadcasting received shape to other clients in the room
        const receivers = Array.from(clients).filter(c => c.rooms.has(roomName) && c.userId !== client.userId);
        console.log(`📤 Broadcasting shape:add to ${receivers.length} clients in room "${roomName}"`);

        broadcastToRoom(roomName, {
          type: "shape:add",
          roomName,
          shape,
        }, client);
        break;
      }

      case "shape:delete": {
        const { roomName, shapeId } = payload;
        console.log(`[SERVER] 🗑️ Received shape:delete from ${client.userId}`, {
          roomName,
          shapeId,
          timestamp: new Date().toLocaleTimeString(),
        });

        const receivers = Array.from(clients).filter(c => c.rooms.has(roomName) && c.userId !== client.userId);
        console.log(`📤 Broadcasting shape:delete to ${receivers.length} clients in room "${roomName}"`);

        broadcastToRoom(roomName, {
          type: "shape:delete",
          roomName,
          shapeId,
        }, client);
        break;
      }

      default: {
        console.warn("❓ Unknown message type:", type);
      }
    }
  });

  ws.on("close", (code, reason) => {
    clients.delete(client);
    console.log(`👋 Client ${client.userId} disconnected (code: ${code}, reason: ${reason})`);
    console.log(`📊 Total clients remaining: ${clients.size}`);
  });

  ws.on("error", (error) => {
    console.error(`❌ WebSocket error for client ${client.userId}:`, error);
  });
});