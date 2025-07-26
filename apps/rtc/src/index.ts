import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { IncomingMessage } from "http";
import { parse } from "cookie";
import dotenv from 'dotenv';
dotenv.config();

const wss = new WebSocketServer({ port: 8081 }); // Run RTC on a different port
console.log('CLERK_SECRET_KEY loaded:', process.env.CLERK_SECRET_KEY ? 'YES' : 'NO');
wss.on("listening", () => {
  console.log("🎥 WebRTC signaling server running on ws://localhost:8081");
});

interface RTCClient {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
}

const rtcClients: Set<RTCClient> = new Set();

// Verify Clerk session token from cookies
async function verifyClerkSession(sessionToken: string): Promise<string | null> {
  try {
    // Method 1: Try verifyToken (for JWT tokens)
    try {
      const payload = await clerkClient.verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      return payload.sub; // This is the user ID
    } catch (tokenError) {
      console.log("⚠️ verifyToken failed, trying verifySession...");
    }

    // Method 2: Try verifySession if verifyToken fails
    // We need to extract session ID from the token
    const tokenParts = sessionToken.split('.');
    if (tokenParts.length === 3 && tokenParts[1]) {
      // Decode JWT payload to get session ID
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

// Extract authentication from cookies
async function authenticateUser(request: IncomingMessage): Promise<string | null> {
  const cookieHeader = request.headers.cookie;
  console.log('🍪 RTC Raw cookies:', cookieHeader);
  
  if (!cookieHeader) {
    console.log('❌ No cookies found');
    return null;
  }

  const cookies = parse(cookieHeader);
  const sessionToken = cookies['__session']; // Clerk's default session cookie
  
  console.log('📝 RTC Session token:', sessionToken ? 'Present' : 'Missing');
  
  if (!sessionToken) {
    console.log('❌ No __session cookie found');
    console.log('🔍 Available cookies:', Object.keys(cookies));
    return null;
  }

  const userId = await verifyClerkSession(sessionToken);
  console.log('🔐 RTC Verification result:', userId ? `Success: ${userId}` : 'Failed');
  return userId;
}

function broadcastToRoom(roomName: string, sender: RTCClient, payload: any) {
  const msg = JSON.stringify(payload);
  rtcClients.forEach((client) => {
    if (client !== sender && client.rooms.has(roomName)) {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(msg);
        }
      } catch (error) {
        // Clean up dead connections
        rtcClients.delete(client);
      }
    }
  });
}

wss.on("connection", async (ws, request) => {
  const userId = await authenticateUser(request);

  if (!userId) {
    return ws.close(4001, "invalidtoken");
  }

  const client: RTCClient = { ws, userId, rooms: new Set() };
  rtcClients.add(client);

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

      // Signaling messages
      case "rtc:offer":
      case "rtc:answer":
      case "rtc:candidate": {
        const { roomName } = payload;
        broadcastToRoom(String(roomName), client, payload);
        break;
      }

      default: {
        console.warn("Unknown RTC message type:", type);
      }
    }
  });

  ws.on("close", () => {
    rtcClients.delete(client);
  });
});