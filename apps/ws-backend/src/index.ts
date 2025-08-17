import { WebSocketServer, WebSocket as WSWebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

const HEARTBEAT_INTERVAL = 30000; 
const CLIENT_TIMEOUT = 60000;

type ClientInfo = {
  ws: WSWebSocket;
  userId: string;
  rooms: Set<string>;
  lastPing?: number;
  heartbeatTimer?: NodeJS.Timeout; 
};

type Room = {
  participants: Map<string, ClientInfo>;
  roomType?: 'duo' | 'group'; 
};

const roomCreators: Map<string, string> = new Map();
const roomSecrets: Map<string, string> = new Map(); 
const roomTypes: Map<string, 'duo' | 'group'> = new Map();
const clients = new Set<ClientInfo>();
const rooms: Map<string, Room> = new Map();

function broadcastToRoom(roomId: string, data: any, exclude?: ClientInfo) {
  const room = rooms.get(roomId);
  if (!room) return;

  const message = JSON.stringify(data);

  for (const [userId, client] of room.participants.entries()) {
    if (client !== exclude && client.ws.readyState === client.ws.OPEN) {
      client.ws.send(message);
    }
  }
}

function handleClientDisconnect(client: ClientInfo) {
  if (client.heartbeatTimer) {
    clearInterval(client.heartbeatTimer);
  }
  
  client.rooms.forEach((roomId) => {
    const room = rooms.get(roomId);
    if (room && room.participants.has(client.userId)) {
      const isCreator = roomCreators.get(roomId) === client.userId;
      room.participants.delete(client.userId);
      
      if (isCreator && room.participants.size > 0) {
        broadcastToRoom(roomId, {
          type: "creator_left",
          roomId,
          message: "Room creator has left. This room is no longer accessible.",
          userId: client.userId,
          timestamp: new Date().toISOString(),
        });
      } else if (room.participants.size > 0) {
        broadcastToRoom(roomId, {
          type: "user_left",
          roomId,
          userId: client.userId,
          participantCount: room.participants.size,
          timestamp: new Date().toISOString(),
        });
      }

      if (room.participants.size === 0 || isCreator) {
        rooms.delete(roomId);
        roomSecrets.delete(roomId);
        roomTypes.delete(roomId);
        roomCreators.delete(roomId);
      }
    }
  });
  
  clients.delete(client);
}

wss.on("connection", (ws, request) => {
  const dummyUserId = `user_${Math.floor(Math.random() * 10000)}`;
  const client: ClientInfo = {
    ws,
    userId: dummyUserId,
    rooms: new Set(),
    lastPing: Date.now(),
  };
  clients.add(client);

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, roomId, shape, shapeId} = data;
      
      switch (type) {
        case "create_room": {
          const newRoom = roomId || `room_${Date.now()}`;
          const encryptionKey = data.encryptionKey;
          const roomType = data.roomType || 'group';
          
          if (!encryptionKey) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Missing encryption key.",
            }));
            return;
          }
          
          if (!rooms.has(newRoom)) {
            rooms.set(newRoom, { participants: new Map() });
            roomSecrets.set(newRoom, encryptionKey);
            roomTypes.set(newRoom, roomType);
            roomCreators.set(newRoom, client.userId);
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
          const encryptionKey = data.encryptionKey;
          
          if (!rooms.has(roomId)) {
            ws.send(JSON.stringify({
              type: "error",
              message: `Room "${roomId}" does not exist.`,
            }));
            return;
          }
          
          const expectedKey = roomSecrets.get(roomId);
          if (!expectedKey || encryptionKey !== expectedKey) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid or missing encryption key.",
            }));
            return;
          }
        
          const room = rooms.get(roomId)!;
          const roomType = roomTypes.get(roomId) || 'group';
          
          if (room.participants.has(client.userId)) {
            room.participants.set(client.userId, client);
            client.rooms.add(roomId);
            ws.send(JSON.stringify({
              type: "joined_successfully",
              roomId,
              userId: client.userId,
              reconnected: true,
            }));
            break;
          }
  
          if (roomType === 'duo') {
            if (room.participants.size >= 2) {
              const activeParticipants = new Map<string, ClientInfo>();
              const removedUsers = [];
              
              for (const [userId, participant] of room.participants) {
                if (participant.ws.readyState === WSWebSocket.OPEN) {
                  activeParticipants.set(userId, participant);
                } else {
                  removedUsers.push(userId);
                }
              }
              
              room.participants = activeParticipants;
              
              if (room.participants.size >= 2) {
                ws.send(JSON.stringify({
                  type: "room_full",
                  message: "This duo room is full. Only 2 participants are allowed.",
                  roomId: roomId,
                  maxCapacity: 2,
                  currentCount: room.participants.size,
                }));
                return;
              }
            }
          }

          room.participants.set(client.userId, client);
          client.rooms.add(roomId);

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
          const encryptionKey = data.encryptionKey;
          const expectedKey = roomSecrets.get(roomId);
          
          if (!expectedKey || encryptionKey !== expectedKey) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid or missing encryption key.",
            }));
            return;
          }

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
          const encryptionKey = data.encryptionKey;
          const expectedKey = roomSecrets.get(roomId);
          
          if (!expectedKey || encryptionKey !== expectedKey) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid or missing encryption key.",
            }));
            return;
          }

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
          if (!roomId || !data.shape) return;
          const encryptionKey = data.encryptionKey;
          const expectedKey = roomSecrets.get(roomId);

          if (!expectedKey || encryptionKey !== expectedKey) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Invalid or missing encryption key.",
            }));
            return;
          }
          broadcastToRoom(roomId, {
            type: "shape_update",
            roomId,
            userId: client.userId,
            shape: data.shape,  
            timestamp: new Date().toISOString(),
          }, client);
  
          break;
        }

        default:
          break;
        }
      } catch (err) {

      }
    });

  client.heartbeatTimer = setInterval(() => {
    if (ws.readyState === WSWebSocket.OPEN) {
      const now = Date.now();
      if (client.lastPing && (now - client.lastPing) > CLIENT_TIMEOUT) {
        ws.terminate();
        handleClientDisconnect(client);
        return;
      }
      
      try {
        ws.ping();
      } catch (error) {
        handleClientDisconnect(client);
      }
    } else {
      handleClientDisconnect(client);
    }
  }, HEARTBEAT_INTERVAL);

  ws.on('pong', () => {
    client.lastPing = Date.now();
  });

  ws.on("close", () => {
    handleClientDisconnect(client);
  });

  ws.on("error", (error) => {
    handleClientDisconnect(client);
  });
});

console.log("✅ WebSocket server running at ws://localhost:8080");