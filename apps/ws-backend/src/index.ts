import {WebSocketServer} from "ws";

const wss = new WebSocketServer({ port:8080 });
console.log("dajghafhdfguifil")
wss.on('connection',function connection(ws) {
    ws.on('message' , function message(data){
        ws.send('pong');
    });
})