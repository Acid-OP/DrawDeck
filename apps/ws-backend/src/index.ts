import {WebSocketServer} from "ws";
import jwt, { type JwtPayload } from "jsonwebtoken";
import {JWT_SECRET} from '@repo/backend-common'
import WebSocket from "ws";
import {prismaClient} from "@repo/db/client";
const wss = new WebSocketServer({ port:8080 });

interface User {
    ws: WebSocket,
    rooms : string[],
    userId : string
}

const users: User[] = [];

function checkUser(token:string): string |  null {
    try{
        const decoded = jwt.verify(token , JWT_SECRET);
        if(typeof decoded == "string"){
            return null
        }
        if(!decoded || !decoded.userId){
            return null;
        }
    return decoded.userId;
    }catch(e){
        return null;
    }
}
wss.on('connection',function connection(ws , request) {
    const url = request.url;

    if(!url){
        return;
    }
    const queryParams = new URLSearchParams(url.split('?')[1]);
    const token = queryParams.get('token')|| "";
    const userId = checkUser(token);
    
    if(userId== null){
        ws.close()
        return null;
    }

    users.push({
        userId,
        rooms : [],
        ws
    })

    ws.on('message' , async function message(data){
        let parsedData;
        if(typeof data !== "string"){
            parsedData = JSON.parse(data.toString());
        }else{
            parsedData = JSON.parse(data);
        }

        if(parsedData.type == "join_room"){
            const user = users.find(x => x.ws === ws);
            user?.rooms.push(parsedData.roomId);
        }

        if(parsedData.type == "leave_room"){
            const user = users.find(x => x.ws === ws);
            if(!user){
                return;
            }
            user.rooms = user?.rooms.filter(x => x !== parsedData.roomId);
        }

        if(parsedData.type == "chat"){
            const roomId = parsedData.roomId;
            const message = parsedData.message;

            await prismaClient.chat.create({
                data : {
                    roomId: Number(roomId),
                    message,
                    userId
                }
            });

            users.forEach(user =>{
                if(user.rooms.includes(roomId)){
                    user.ws.send(JSON.stringify({
                        type: "chat",
                        message: message,
                        roomId
                    }))
                }
            })
        }
    });
});