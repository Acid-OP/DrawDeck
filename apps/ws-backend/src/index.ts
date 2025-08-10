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
      console.log(`📤 Sending to ${userId} in room "${roomId}": ${data.type}`);
      client.ws.send(message);
    }
  }
}
function logRoomState(roomId: string, action: string, userId?: string) {
  const room = rooms.get(roomId);
  const roomType = roomTypes.get(roomId);
  const creator = roomCreators.get(roomId);
  
  console.log(`\n🔍 [${action}] Room State Debug:`);
  console.log(`   Room ID: ${roomId}`);
  console.log(`   Room Type: ${roomType}`);
  console.log(`   Creator: ${creator}`);
  console.log(`   Current User: ${userId || 'N/A'}`);
  
  if (room) {
    console.log(`   Participants Count: ${room.participants.size}`);
    console.log(`   Participants List: [${Array.from(room.participants.keys()).join(', ')}]`);
    
    // Check connection states
    const activeConnections = [];
    const deadConnections = [];
    
    for (const [id, client] of room.participants) {
      if (client.ws.readyState === WSWebSocket.OPEN) {
        activeConnections.push(id);
      } else {
        deadConnections.push(`${id}(state:${client.ws.readyState})`);
      }
    }
    
    console.log(`   Active Connections: [${activeConnections.join(', ')}]`);
    console.log(`   Dead Connections: [${deadConnections.join(', ')}]`);
  } else {
    console.log(`   Room Status: DOES NOT EXIST`);
  }
  console.log(`🔍 [${action}] End Debug\n`);
}
function printRoomMembers(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;
  const users = Array.from(room.participants.keys()).join(", ");
  console.log(`👥 Current users in "${roomId}": [${users}]`);
}
function handleClientDisconnect(client: ClientInfo) {
  console.log(`🧹 Cleaning up user: ${client.userId}`);

  if (client.heartbeatTimer) {
    clearInterval(client.heartbeatTimer);
  }
  
  client.rooms.forEach((roomId) => {
    const room = rooms.get(roomId);
    if (room && room.participants.has(client.userId)) {
      const isCreator = roomCreators.get(roomId) === client.userId;
      room.participants.delete(client.userId);
      console.log(`🧹 Removed ${client.userId} from room ${roomId}`);
      
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

      // Clean up room if empty or creator left
      if (room.participants.size === 0 || isCreator) {
        rooms.delete(roomId);
        roomSecrets.delete(roomId);
        roomTypes.delete(roomId);
        roomCreators.delete(roomId);
        console.log(`🗑️ Room ${roomId} deleted`);
      } else {
        printRoomMembers(roomId);
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
  console.log(`✅ Dummy client connected: ${client.userId}`);

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      const { type, roomId, shape, shapeId, updatedShape } = data;
      
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

            printRoomMembers(newRoom);
            break;
        }
        case "join-room": {
          if (!roomId) return;
          const encryptionKey = data.encryptionKey;
  console.log(`\n🚪 JOIN ATTEMPT: ${client.userId} trying to join room "${roomId}"`);
  logRoomState(roomId, "BEFORE_JOIN", client.userId);
  if (!rooms.has(roomId)) {
     console.log(`❌ Room "${roomId}" does not exist`);
    ws.send(JSON.stringify({
      type: "error",
      message: `Room "${roomId}" does not exist.`,
    }));
    return;
  }

  const expectedKey = roomSecrets.get(roomId);
  if (!expectedKey || encryptionKey !== expectedKey) {
    console.log(`❌ Invalid encryption key for room "${roomId}"`);
    ws.send(JSON.stringify({
      type: "error",
      message: "Invalid or missing encryption key.",
    }));
    return;
  }

  const room = rooms.get(roomId)!;
  const roomType = roomTypes.get(roomId) || 'group';
  console.log(`🏷️ Room type: ${roomType}`);
  if (room.participants.has(client.userId)) {
    console.log(`🔄 RECONNECTION DETECTED: ${client.userId} already in room ${roomId}`);
    room.participants.set(client.userId, client);
    client.rooms.add(roomId);
    logRoomState(roomId, "AFTER_RECONNECTION", client.userId);
    ws.send(JSON.stringify({
      type: "joined_successfully",
      roomId,
      userId: client.userId,
      reconnected: true,
    }));
        
    console.log(`✅ ${client.userId} reconnected to room "${roomId}"`);
    printRoomMembers(roomId);
    break;
  }
  
  if (roomType === 'duo') {
    console.log(`🔒 DUO ROOM CAPACITY CHECK: Current size = ${room.participants.size}`);
    if (room.participants.size >= 2) {
      console.log(`⚠️ DUO ROOM APPEARS FULL - Cleaning dead connections...`);
      console.log(`📊 Before cleanup:`);
      for (const [userId, participant] of room.participants) {
        console.log(`   - ${userId}: readyState = ${participant.ws.readyState} (${participant.ws.readyState === WSWebSocket.OPEN ? 'OPEN' : 'CLOSED/CLOSING'})`);
      }
    const activeParticipants = new Map<string, ClientInfo>();
    const removedUsers = [];
    for (const [userId, participant] of room.participants) {
      if (participant.ws.readyState === WSWebSocket.OPEN) {
        activeParticipants.set(userId, participant);
        console.log(`✅ Keeping active connection: ${userId}`);
      } else {
        removedUsers.push(userId);
        console.log(`🧹 Removing dead connection: ${userId} (state: ${participant.ws.readyState})`);
      }
    }
    room.participants = activeParticipants;
     console.log(`📊 After cleanup: ${room.participants.size} participants, removed: [${removedUsers.join(', ')}]`);
      logRoomState(roomId, "AFTER_CLEANUP", client.userId);
    // Re-check capacity after cleanup
    if (room.participants.size >= 2) {
      ws.send(JSON.stringify({
        type: "room_full",
        message: "This duo room is full. Only 2 participants are allowed.",
        roomId: roomId,
        maxCapacity: 2,
        currentCount: room.participants.size,
      }));
      console.log(`🚫 ${client.userId} tried to join full duo room "${roomId}" (${room.participants.size}/2)`);
      return;
    }else {
        console.log(`✅ DUO ROOM HAS SPACE AFTER CLEANUP - Allowing ${client.userId} to join`);
      }} else {
      console.log(`✅ DUO ROOM HAS SPACE - Allowing ${client.userId} to join`);
    }
  }
  
  // Add new user
  room.participants.set(client.userId, client);
  client.rooms.add(roomId);
  console.log(`✅ ${client.userId} successfully joined room "${roomId}"`);
  logRoomState(roomId, "AFTER_JOIN", client.userId);

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
  console.log("shape added",encryptionKey);
          const expectedKey = roomSecrets.get(roomId);
if (!expectedKey || encryptionKey !== expectedKey) {
  ws.send(JSON.stringify({
    type: "error",
    message: "Invalid or missing encryption key.",
  }));
  return;
}

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
                    const encryptionKey = data.encryptionKey;
  console.log("deleetd",encryptionKey);
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
// Set up heartbeat
// Replace your heartbeat timer setup with this:
client.heartbeatTimer = setInterval(() => {
  if (ws.readyState === WSWebSocket.OPEN) {
    const now = Date.now();
    if (client.lastPing && (now - client.lastPing) > CLIENT_TIMEOUT) {
      console.log(`💔 Client ${client.userId} timed out (last ping: ${new Date(client.lastPing).toISOString()})`);
      
      // Log which rooms this client was in
      if (client.rooms.size > 0) {
        console.log(`💔 Timing out client ${client.userId} who was in rooms: [${Array.from(client.rooms).join(', ')}]`);
        client.rooms.forEach(roomId => logRoomState(roomId, "BEFORE_TIMEOUT_CLEANUP", client.userId));
      }
      
      ws.terminate();
      handleClientDisconnect(client);
      return;
    }
    
    try {
      ws.ping();
      console.log(`🏓 Ping sent to ${client.userId} (rooms: [${Array.from(client.rooms).join(', ')}])`);
    } catch (error) {
      console.log(`❌ Ping failed for ${client.userId}:`, error);
      handleClientDisconnect(client);
    }
  } else {
    console.log(`🔌 Connection dead for ${client.userId} (readyState: ${ws.readyState})`);
    if (client.rooms.size > 0) {
      console.log(`🔌 Dead connection ${client.userId} was in rooms: [${Array.from(client.rooms).join(', ')}]`);
      client.rooms.forEach(roomId => logRoomState(roomId, "BEFORE_DEAD_CONNECTION_CLEANUP", client.userId));
    }
    handleClientDisconnect(client);
  }
}, HEARTBEAT_INTERVAL);

  // Handle pong responses
  ws.on('pong', () => {
    client.lastPing = Date.now();
    console.log(`🏓 Pong received from ${client.userId}`);
  });

  // Replace your close handler with this:
  ws.on("close", () => {
    console.log(`🔌 WebSocket closed for ${client.userId}`);
    handleClientDisconnect(client);
  });

  // Replace your error handler with this:
  ws.on("error", (error) => {
    console.error(`❌ WebSocket error (user ${client.userId}):`, error);
    handleClientDisconnect(client);
  });
  // ws.on("close", () => {
  //   client.rooms.forEach((roomId) => {
  //     const room = rooms.get(roomId);
  //     if (room) {
  //       const isCreator = roomCreators.get(roomId) === client.userId;
  //       room.participants.delete(client.userId);
  //       if (isCreator && room.participants.size > 0) {
  //         broadcastToRoom(roomId, {
  //         type: "creator_left",
  //         roomId,
  //         message: "Room creator has left. This room is no longer accessible.",
  //         userId: client.userId,
  //         timestamp: new Date().toISOString(),
  //       });
  //     } else{
  //       broadcastToRoom(roomId, {
  //         type: "user_left",
  //         roomId,
  //         userId: client.userId,
  //         participantCount: room.participants.size,
  //         timestamp: new Date().toISOString(),
  //       });
  //     }

  //       const hasOthers = room.participants.size > 0;
  //       if (!hasOthers || isCreator) {
  //         rooms.delete(roomId);
  //         roomSecrets.delete(roomId);
  //         roomTypes.delete(roomId);
  //         roomCreators.delete(roomId)
  //       } else {
  //         printRoomMembers(roomId);
  //       }
  //     }
  //   });

  //   clients.delete(client);
  //   console.log(`❌ Client disconnected: ${client.userId}`);
  // });

  ws.on("error", (error) => {
    console.error(`❌ WebSocket error (user ${client.userId}):`, error);
  });
});

console.log("✅ WebSocket server running at ws://localhost:8080");