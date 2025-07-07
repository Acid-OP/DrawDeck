import {WebSocketServer} from "ws";
import jwt, { type JwtPayload } from "jsonwebtoken";
import {JWT_SECRET} from '@repo/backend-common/index'
import WebSocket from "ws";
import {prismaClient} from "@repo/db/client";
const wss = new WebSocketServer({ port:8080 });

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

function broadcastToRoom(roomId: string, payload: unknown) {
  const msg = JSON.stringify(payload);
  clients.forEach((c) => {
    if (c.rooms.has(roomId)) c.ws.send(msg);
  });
}

wss.on('connection',function connection(ws , request) {
  const query = new URL(request.url ?? "", "http://localhost");
  const userId = verifyToken(query.searchParams.get("token") ?? "");
  if (!userId) {
    return ws.close(4001, "invalidtoken");
  }
  const client: ClientInfo = { ws, userId, rooms: new Set() };
  clients.add(client);
  
  ws.on("message", async (raw) => {
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

      case "shape:add": {
        const { roomId, shape } = payload;
        try {
          await prismaClient.shape.create({
            data: {
              id: typeof shape.id === "string" ? shape.id : undefined,
              roomId: Number(roomId),
              userId,
              type: shape.type,
              data: shape, 
            },
          });

          broadcastToRoom(String(roomId), {
            type: "shape:add",
            roomId,
            shape,
          });
        } catch (err) {
          console.error("shape:add failed", err);
        }
        break;
      }

      case "shape:delete": {
        const { roomId, shapeId } = payload;
        try {
          await prismaClient.shape.delete({ where: { id: shapeId } });
          broadcastToRoom(String(roomId), {
            type: "shape:delete",
            roomId,
            shapeId,
          });
        } catch (err) {
          console.error("shape:delete failed", err);
        }
        break;
      }

    }
  });
  
  ws.on("close", () => {
    clients.delete(client);
  });
});