import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { IncomingMessage } from "http";
import { randomUUID } from "crypto";

const allowedOrigins = [
  'https://drawdeck.xyz',
  'https://www.drawdeck.xyz'
  // 'http://localhost:3000' // For development only
];
const wss = new WebSocketServer({port: 8081,
  verifyClient: (info: { origin: string; secure: boolean; req: IncomingMessage }) => {
    if (!allowedOrigins.includes(info.origin)) {
      console.log(`🚫 RTC connection rejected - Invalid origin: ${info.origin}`);
      return false;
    }
    return true;
  }
});

wss.on("listening", () => {
  console.log("🎥 WebRTC signaling server running");
});

interface RTCClient {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
}

const rtcClients: Set<RTCClient> = new Set();

function broadcastToRoom(roomId: string, sender: RTCClient, payload: any) {
  const msg = JSON.stringify(payload);
  rtcClients.forEach((client) => {
    if (client !== sender && client.rooms.has(roomId)) {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(msg);
        }
      } catch (error) {
        rtcClients.delete(client);
      }
    }
  });
}

wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
  const client: RTCClient = {
    ws,
    userId: randomUUID(), 
    rooms: new Set(),
  };
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
        client.rooms.add(String(payload.roomId));
        break;
      }

      case "leave_room": {
        client.rooms.delete(String(payload.roomId));
        break;
      }

      case "rtc:offer":
      case "rtc:answer":
      case "rtc:candidate": {
        const { roomId } = payload;
        broadcastToRoom(String(roomId), client, payload);
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
