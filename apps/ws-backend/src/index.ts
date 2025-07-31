import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { IncomingMessage } from "http";
import { parse } from "cookie";
import dotenv from "dotenv";
dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
  lastPong: number;
}

const clients: Set<ClientInfo> = new Set();

wss.on("listening", () => {
  console.log("✅ WebSocket server is listening on ws://localhost:8080");
});


async function verifyClerkSession(sessionToken: string): Promise<string | null> {
  try {
    try {
      const payload = await clerkClient.verifyToken(sessionToken, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      return payload.sub;
    } catch {
      const tokenParts = sessionToken.split(".");
      if (tokenParts.length === 3 && tokenParts[1]) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
        const sessionId = payload.sid;
        if (sessionId) {
          const session = await clerkClient.sessions.verifySession(sessionId, sessionToken);
          return session.userId;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("❌ Clerk session verification failed:", error);
    return null;
  }
}

async function authenticateUser(request: IncomingMessage): Promise<string | null> {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = parse(cookieHeader);
  const sessionToken = cookies["__session"];
  if (!sessionToken) return null;

  return await verifyClerkSession(sessionToken);
}

function broadcastToRoom(roomName: string, payload: unknown) {
  const msg = JSON.stringify(payload);
  clients.forEach((client) => {
    if (client.rooms.has(roomName) && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(msg);
      } catch (error) {
        console.error("❌ Failed to send to client:", error);
        clients.delete(client);
      }
    }
  });
}

setInterval(() => {
  const now = Date.now();

  clients.forEach((client) => {
    if (now - client.lastPong > 5000) {
      console.warn("❌ Client timed out, closing:", client.userId);
      try {
        client.ws.terminate(); 
      } catch {}
      clients.delete(client);
    } else {
      try {
        client.ws.send(JSON.stringify({ type: "ping" }));
      } catch {
        clients.delete(client);
      }
    }
  });
}, 30000);

wss.on("connection", async (ws, request) => {
  const userId = await authenticateUser(request);
  if (!userId) return ws.close(4001, "Invalid session");

  const client: ClientInfo = { ws, userId, rooms: new Set(), lastPong: Date.now() };
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
      case "pong":
        client.lastPong = Date.now(); 
        break;

      case "join_room":
        client.rooms.add(String(payload.roomName));
        break;

      case "leave_room":
        client.rooms.delete(String(payload.roomName));
        break;

      case "shape:add": {
        const { roomName, shape } = payload;
        broadcastToRoom(String(roomName), { type: "shape:add", roomName, shape });
        break;
      }

      case "shape:delete": {
        const { roomName, shapeId } = payload;
        broadcastToRoom(String(roomName), { type: "shape:delete", roomName, shapeId });
        break;
      }

      default:
        console.warn("⚠️ Unknown message type:", type);
    }
  });

  ws.on("close", () => {
    clients.delete(client);
  });

  ws.on("error", (err) => {
    console.error("❌ WebSocket error:", err);
    clients.delete(client);
  });
});