import { WebSocketServer, WebSocket as WSWebSocket } from "ws";
// import { clerkClient } from "@clerk/clerk-sdk-node";
// import { parse } from "cookie";
// import dotenv from "dotenv";
// dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

type ClientInfo = {
  ws: WSWebSocket;
  userId: string;
  rooms: Set<string>;
};

type Room = {
  participants: Map<string, ClientInfo>;
};

const clients = new Set<ClientInfo>();
const rooms: Map<string, Room> = new Map();

function broadcastToRoom(roomName: string, data: any, exclude?: ClientInfo) {
  const room = rooms.get(roomName);
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
  console.log(`✅ Dummy client connected: ${client.userId}`);

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, roomId, roomName, shape, shapeId, updatedShape } = data;

      switch (type) {
        case "create_room": {
          const newRoom = roomId || roomName || `room_${Date.now()}`;
          if (!rooms.has(newRoom)) {
            rooms.set(newRoom, { participants: new Map() });
            console.log(`🏠 Room created: "${newRoom}"`);
          }
          const room = rooms.get(newRoom)!;
          room.participants.set(client.userId, client);
          client.rooms.add(newRoom);

          ws.send(JSON.stringify({
            type: "room_created",
            roomId: newRoom,
            userId: client.userId,
          }));
          break;
        }

        case "join-room": {
          if (!roomId) return;

          if (!rooms.has(roomId)) {
            ws.send(JSON.stringify({
              type: "error",
              message: `Room "${roomId}" does not exist.`,
            }));
            return;
          }

          const room = rooms.get(roomId)!;
          room.participants.set(client.userId, client);
          client.rooms.add(roomId);

          console.log(`👥 ${client.userId} joined room "${roomId}"`);

          ws.send(JSON.stringify({
            type: "joined_successfully",
            roomId,
            userId: client.userId,
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
          if (!roomId || !shape) return;
          console.log(`➕ Shape added in "${roomId}" by ${client.userId}`);

          broadcastToRoom(roomId, {
            type: "shape_added",
            roomId,
            userId: client.userId,
            shape,
            timestamp: new Date().toISOString(),
          }, client);
          break;
        }

        case "shape_delete": {
          if (!roomId || !shapeId) return;
          console.log(`❌ Shape deleted in "${roomId}" by ${client.userId}`);

          broadcastToRoom(roomId, {
            type: "shape_deleted",
            roomId,
            userId: client.userId,
            shapeId,
            timestamp: new Date().toISOString(),
          }, client);
          break;
        }

        case "shape_update": {
          if (!roomId || !updatedShape || !updatedShape.id) return;
          console.log(`✏️ Shape updated in "${roomId}" by ${client.userId}`);

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

        const hasOthers = Array.from(room.participants.values()).length > 0;
        if (!hasOthers) {
          rooms.delete(roomId);
          console.log(`🧹 Deleted empty room: "${roomId}"`);
        }
      }
    });

    clients.delete(client);
    console.log(`❌ Dummy client ${client.userId} disconnected`);
  });

  ws.on("error", (error) => {
    console.error(`❌ WebSocket error (user ${client.userId}):`, error);
  });
});
console.log("✅ WebSocket server running at ws://localhost:8080");