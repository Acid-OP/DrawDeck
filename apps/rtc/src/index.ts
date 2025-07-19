import { WebSocketServer } from "ws";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/index";
import WebSocket from "ws";

const wss = new WebSocketServer({ port: 8081 }); // Run RTC on a different port

wss.on("listening", () => {
  console.log("🎥 WebRTC signaling server running on ws://localhost:8081");
});

interface RTCClient {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
}

const rtcClients: Set<RTCClient> = new Set();

function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return typeof decoded === "object" && decoded.userId ? decoded.userId : null;
  } catch {
    return null;
  }
}

function broadcastToRoom(roomName: string, sender: RTCClient, payload: any) {
  const msg = JSON.stringify(payload);
  rtcClients.forEach((client) => {
    if (client !== sender && client.rooms.has(roomName)) {
      client.ws.send(msg);
    }
  });
}

wss.on("connection", (ws, request) => {
  const query = new URL(request.url ?? "", "http://localhost");
  const userId = verifyToken(query.searchParams.get("token") ?? "");

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
