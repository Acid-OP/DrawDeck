import { WebSocketServer } from "ws";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/index";
import WebSocket from "ws";

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

function verifyToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return typeof decoded === "object" && decoded.userId ? decoded.userId : null;
  } catch {
    return null;
  }
}

function broadcastToRoom(roomName: string, payload: unknown) {
  const msg = JSON.stringify(payload);
  clients.forEach((client) => {
    if (client.rooms.has(roomName)) {
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
