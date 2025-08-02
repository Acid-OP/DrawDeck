import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { IncomingMessage } from "http";
import { randomUUID } from "crypto";

const wss = new WebSocketServer({ port: 8081 });

wss.on("listening", () => {
  console.log("🎥 WebRTC signaling server running on ws://localhost:8081");
});

interface RTCClient {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
}

const rtcClients: Set<RTCClient> = new Set();

function broadcastToRoom(roomName: string, sender: RTCClient, payload: any) {
  const msg = JSON.stringify(payload);
  rtcClients.forEach((client) => {
    if (client !== sender && client.rooms.has(roomName)) {
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
        client.rooms.add(String(payload.roomName));
        break;
      }

      case "leave_room": {
        client.rooms.delete(String(payload.roomName));
        break;
      }

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
