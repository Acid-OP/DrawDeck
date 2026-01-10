import { WebSocketServer } from "ws";
import WebSocket from "ws";
import { IncomingMessage } from "http";
import { randomUUID } from "crypto";

const allowedOrigins = [
  'https://drawdeck.xyz',
  'https://www.drawdeck.xyz',
  // 'http://localhost:3000' 
];

const PORT = Number(process.env.PORT) || 8081;

const wss = new WebSocketServer({
  port: PORT,
  verifyClient: (info: { origin: string; secure: boolean; req: IncomingMessage }) => {
    if (!allowedOrigins.includes(info.origin)) {
      console.log(`RTC connection rejected - Invalid origin: ${info.origin}`);
      return false;
    }
    return true;
  }
});

wss.on("listening", () => {
  console.log(`WebRTC signaling server running on port ${PORT}`);
});

interface RTCClient {
  ws: WebSocket;
  userId: string;
  rooms: Set<string>;
  isCreator?: boolean;
  roomId?: string; 
}

const rtcClients: Set<RTCClient> = new Set();
const roomCreators: Map<string, string> = new Map(); 

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
          rtcClients.delete(client);
        }
      } catch (error) {
        console.error('Error broadcasting RTC message:', error);
        rtcClients.delete(client);
      }
    }
  });
}

function cleanupRoom(roomId: string, reason: string = 'room_cleanup') {
  
  const roomClients = Array.from(rtcClients).filter(client => client.rooms.has(roomId));
  
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
      
      client.rooms.delete(roomId);
      
      if (client.rooms.size === 0) {
        setTimeout(() => {
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.close(1000, 'No active rooms');
          }
        }, 500);
      }
      
    } catch (error) {
      console.error('Error during RTC room cleanup:', error);
      rtcClients.delete(client);
    }
  });

  roomCreators.delete(roomId);
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
      console.warn('Invalid RTC message format');
      return;
    }

    const { type } = payload;

    switch (type) {
      case "join_room": {
        const roomId = String(payload.roomId);
        client.rooms.add(roomId);
        client.roomId = roomId;

        if (!roomCreators.has(roomId)) {
          roomCreators.set(roomId, client.userId);
          client.isCreator = true;
        }
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
        
        if (isCreator) {
          broadcastToRoom(roomId, client, {
            type: "rtc_creator_left",
            roomId,
            userId: client.userId,
            message: "Video call ended - room creator left"
          });
          
          setTimeout(() => {
            cleanupRoom(roomId, 'creator_left');
          }, 100);
          
        } else {
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
      case "cleanup_session": {
        const roomId = String(payload.roomId);
        console.log(`RTC session cleanup requested for room ${roomId} by ${client.userId}`);
        
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
        console.warn("Unknown RTC message type:", type);
      }
    }
  });
  
  ws.on("close", (code, reason) => {
    client.rooms.forEach(roomId => {
      const isCreator = roomCreators.get(roomId) === client.userId;
      
      if (isCreator) {
        broadcastToRoom(roomId, client, { 
          type: "rtc_creator_disconnected",
          userId: client.userId,
          roomId,
          message: "Video call ended - room creator disconnected"
        });
        
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
    console.error(`RTC WebSocket error for client ${client.userId}:`, error);
    rtcClients.delete(client);
  });
});

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
}, 30000); 

console.log("RTC WebSocket server setup complete");
