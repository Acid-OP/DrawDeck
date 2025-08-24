import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { IncomingMessage } from "http";
import { randomUUID } from "crypto";

const allowedOrigins = [
  'https://drawdeck.xyz',
  'https://www.drawdeck.xyz',
  'http://localhost:3000' 
];

const wss = new WebSocketServer({
  port: 8081,
  verifyClient: (info: { origin: string; secure: boolean; req: IncomingMessage }) => {
    if (!allowedOrigins.includes(info.origin)) {
      console.log(`🚫 RTC connection rejected - Invalid origin: ${info.origin}`);
      return false;
    }
    return true;
  }
});

wss.on("listening", () => {
  console.log("🎥 WebRTC signaling server running on ws://localhost:8081");
});

interface RTCClient {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
  isCreator?: boolean; // Add this to track creators
  roomId?: string; // Track current room for easier cleanup
}

const rtcClients: Set<RTCClient> = new Set();
const roomCreators: Map<string, string> = new Map(); // Track room creators

function broadcastToRoom(roomId: string, sender: RTCClient, payload: any) {
  const msg = JSON.stringify(payload);
  let sentCount = 0;
  
  rtcClients.forEach((client) => {
    if (client !== sender && client.rooms.has(roomId)) {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(msg);
          sentCount++;
        } else {
          // Clean up dead connections
          rtcClients.delete(client);
        }
      } catch (error) {
        console.error('📤 Error broadcasting RTC message:', error);
        rtcClients.delete(client);
      }
    }
  });
  
  if (payload.type !== 'rtc:candidate') { // Don't log frequent ICE candidates
    console.log(`📡 RTC broadcast to room ${roomId}: ${payload.type} (${sentCount} recipients)`);
  }
}

function cleanupRoom(roomId: string, reason: string = 'room_cleanup') {
  console.log(`🧹 Cleaning up RTC room ${roomId} - Reason: ${reason}`);
  
  const roomClients = Array.from(rtcClients).filter(client => client.rooms.has(roomId));
  
  // Notify all clients in the room that it's being cleaned up
  roomClients.forEach(client => {
    try {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({
          type: "room_cleanup",
          roomId,
          reason,
          message: "Video call session ended"
        }));
      }
      
      // Remove room from client
      client.rooms.delete(roomId);
      
      // If client has no more rooms, we could close the connection
      if (client.rooms.size === 0) {
        setTimeout(() => {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.close(1000, 'No active rooms');
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Error during RTC room cleanup:', error);
      rtcClients.delete(client);
    }
  });
  
  // Remove room creator
  roomCreators.delete(roomId);
  
  console.log(`✅ RTC room ${roomId} cleanup completed - ${roomClients.length} clients notified`);
}

wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
  const client: RTCClient = {
    ws,
    userId: randomUUID(),
    rooms: new Set(),
  };
  rtcClients.add(client);
  
  console.log(`🎥 New RTC client connected: ${client.userId}`);

  ws.on("message", (raw) => {
    let payload: any;
    try {
      payload = JSON.parse(raw.toString());
    } catch {
      console.warn('⚠️ Invalid RTC message format');
      return;
    }

    const { type } = payload;

    switch (type) {
      case "join_room": {
        const roomId = String(payload.roomId);
        client.rooms.add(roomId);
        client.roomId = roomId;
        
        // Track if this is a creator (first to join)
        if (!roomCreators.has(roomId)) {
          roomCreators.set(roomId, client.userId);
          client.isCreator = true;
          console.log(`👑 RTC room creator joined: ${client.userId} in room ${roomId}`);
        } else {
          console.log(`👤 RTC participant joined: ${client.userId} in room ${roomId}`);
        }
        
        // Notify others in the room
        broadcastToRoom(roomId, client, {
          type: "user_joined_rtc",
          userId: client.userId,
          roomId
        });
        break;
      }

      case "leave_room": {
        const roomId = String(payload.roomId);
        const isCreator = roomCreators.get(roomId) === client.userId;
        
        console.log(`🚪 RTC user leaving room ${roomId}: ${client.userId} (Creator: ${isCreator})`);
        
        if (isCreator) {
          // Creator leaving - cleanup entire room
          console.log(`👑 RTC creator leaving room ${roomId}, cleaning up room`);
          
          // Notify all other users that creator left
          broadcastToRoom(roomId, client, {
            type: "rtc_creator_left",
            roomId,
            userId: client.userId,
            message: "Video call ended - room creator left"
          });
          
          // Cleanup the entire room after a delay
          setTimeout(() => {
            cleanupRoom(roomId, 'creator_left');
          }, 100);
          
        } else {
          // Regular participant leaving
          client.rooms.delete(roomId);
          broadcastToRoom(roomId, client, {
            type: "user_left_rtc",
            roomId,
            userId: client.userId,
            message: "User left the video call"
          });
        }
        break;
      }

      // Add explicit cleanup case for "Stop Session" button
      case "cleanup_session": {
        const roomId = String(payload.roomId);
        console.log(`🛑 RTC session cleanup requested for room ${roomId} by ${client.userId}`);
        
        // Force cleanup regardless of creator status
        broadcastToRoom(roomId, client, {
          type: "session_ended",
          roomId,
          reason: "user_initiated_stop",
          message: "Video call session ended"
        });
        
        setTimeout(() => {
          cleanupRoom(roomId, 'user_initiated_stop');
        }, 100);
        break;
      }

      case "rtc:offer":
      case "rtc:answer":
      case "rtc:candidate": {
        const { roomId } = payload;
        broadcastToRoom(String(roomId), client, payload);
        break;
      }

      case "user_disconnected_notify": {
        const { roomId } = payload;
        broadcastToRoom(String(roomId), client, { 
          type: "user_disconnected",
          userId: client.userId,
          message: "User has left the call" 
        });
        break;
      }

      default: {
        console.warn("⚠️ Unknown RTC message type:", type);
      }
    }
  });
  
  ws.on("close", (code, reason) => {
    console.log(`🔌 RTC client disconnected: ${client.userId} (Code: ${code}, Reason: ${reason})`);
    
    // Notify all rooms this client was in
    client.rooms.forEach(roomId => {
      const isCreator = roomCreators.get(roomId) === client.userId;
      
      if (isCreator) {
        console.log(`👑 RTC creator disconnected from room ${roomId}, cleaning up`);
        broadcastToRoom(roomId, client, { 
          type: "rtc_creator_disconnected",
          userId: client.userId,
          roomId,
          message: "Video call ended - room creator disconnected"
        });
        
        // Cleanup room after creator disconnect
        setTimeout(() => {
          cleanupRoom(roomId, 'creator_disconnected');
        }, 100);
        
      } else {
        broadcastToRoom(roomId, client, { 
          type: "user_disconnected",
          userId: client.userId,
          roomId,
          message: "User has disconnected from video call"
        });
      }
    });
  
    rtcClients.delete(client);
  });
  
  ws.on("error", (error) => {
    console.error(`❌ RTC WebSocket error for client ${client.userId}:`, error);
    rtcClients.delete(client);
  });
});

// Periodic cleanup of dead connections
setInterval(() => {
  const deadConnections: RTCClient[] = [];
  
  rtcClients.forEach(client => {
    if (client.ws.readyState !== WebSocket.OPEN) {
      deadConnections.push(client);
    }
  });
  
  deadConnections.forEach(client => {
    rtcClients.delete(client);
  });
  
  if (deadConnections.length > 0) {
    console.log(`🧹 Cleaned up ${deadConnections.length} dead RTC connections`);
  }
}, 30000); // Run every 30 seconds

console.log("✅ RTC WebSocket server setup complete");
