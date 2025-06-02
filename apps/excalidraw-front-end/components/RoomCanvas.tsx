"use client"
import { WS_URL } from "@/config";
import { useEffect, useState } from "react";
import { Canvas } from "./Canvas";
export function RoomCanvas({roomId}: {roomId:string}){
    const [socket , setSocket] = useState<WebSocket | null>(null);

    useEffect(()=> {
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjZDg5NjRiNC0wMTkyLTQ3ZDgtODM1Mi1iNmM2OWFjMjdjZjgiLCJpYXQiOjE3NDgzMTA1NTB9.zyNwR7yOUYtpiT5DmrrZhnzqxLAb1YBRibdVn7Tct3w`);

        ws.onopen = () => {
            setSocket(ws);
            ws.send(JSON.stringify({
                type: "join_room",
                roomId
            }))
        }
    },[])

    if(!socket) {
        return <div>
            Connecting to the server
        </div>
    }

    return <div className="bg-[#121212]">
        <Canvas roomId={roomId} socket={socket}/>
    </div>
}