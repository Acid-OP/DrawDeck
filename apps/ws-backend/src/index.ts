import { WebSocketServer, WebSocket as WSWebSocket } from "ws";

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

function broadcastToRoom(roomId: string, data: any, exclude?: ClientInfo) {
  const room = rooms.get(roomId);
  if (!room) return;

  const message = JSON.stringify(data);

  for (const [userId, client] of room.participants.entries()) {
    if (client !== exclude && client.ws.readyState === client.ws.OPEN) {
      console.log(`📤 Sending to ${userId} in room "${roomId}": ${data.type}`);
      client.ws.send(message);
    }
  }
}

function printRoomMembers(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const users = Array.from(room.participants.keys()).join(", ");
  console.log(`👥 Current users in "${roomId}": [${users}]`);
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
      const { type, roomId, shape, shapeId, updatedShape } = data;
      
      switch (type) {
        case "create_room": {
          const newRoom = roomId ||`room_${Date.now()}`;
          if (!rooms.has(newRoom)) {
            rooms.set(newRoom, { participants: new Map() });
            console.log(`🏠 Room created: "${newRoom}" by ${client.userId}`);
          }
          const room = rooms.get(newRoom)!;
          room.participants.set(client.userId, client);
          client.rooms.add(newRoom);

          ws.send(JSON.stringify({
            type: "room_created",
            roomId: newRoom,
            userId: client.userId,
          }));

          printRoomMembers(newRoom);
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

          console.log(`➕ ${client.userId} joined room "${roomId}"`);
          printRoomMembers(roomId);

          ws.send(JSON.stringify({
            type: "joined_successfully",
            roomId,
            userId: client.userId,
          }));

          broadcastToRoom(roomId, {
            type: "join-room",
            userId: client.userId,
            roomId,
            participantCount: room.participants.size,
            timestamp: new Date().toISOString(),
          }, client);
          break;
        }

        case "shape_add": {
          if (!roomId || !shape) return;
          console.log(`🖊️ [${client.userId}] added shape "${shape.id}" in room "${roomId}"`);
          console.log(`📥 Received shape_add from ${client.userId}:`, data.shape);

          broadcastToRoom(roomId, {
            type: "shape_add",
            roomId,
            userId: client.userId,
            shape,
            timestamp: new Date().toISOString(),
          }, client);
          break;
        }

        case "shape_delete": {
          if (!roomId || !shapeId) return;
          console.log(`🗑️ [${client.userId}] deleted shape "${shapeId}" in room "${roomId}"`);

          broadcastToRoom(roomId, {
            type: "shape_delete",
            roomId,
            userId: client.userId,
            shapeId,
            timestamp: new Date().toISOString(),
          }, client);
          break;
        }

        case "shape_update": {
          if (!roomId || !updatedShape || !updatedShape.id) return;
          console.log(`✏️ [${client.userId}] updated shape "${updatedShape.id}" in room "${roomId}"`);

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

        const hasOthers = room.participants.size > 0;
        if (!hasOthers) {
          rooms.delete(roomId);
          console.log(`🧹 Deleted empty room: "${roomId}"`);
        } else {
          printRoomMembers(roomId);
        }
      }
    });

    clients.delete(client);
    console.log(`❌ Client disconnected: ${client.userId}`);
  });

  ws.on("error", (error) => {
    console.error(`❌ WebSocket error (user ${client.userId}):`, error);
  });
});

console.log("✅ WebSocket server running at ws://localhost:8080");
