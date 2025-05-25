import { useEffect, useState } from "react";
import { WS_URL } from "../room/[slug]/config";


export function useSocket(){
    const [loading , setLoading] = useState(true);
    const [socket , SetSocket] = useState<WebSocket>();

    useEffect(()=>{
        const ws = new WebSocket(`${WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiNWFjMmRkOS00YTk2LTQ3ZDgtYTcwOC03Njc4MDU0ZWM1OTgiLCJpYXQiOjE3NDgyMDAwOTl9.f5eyfU2Ha_07yVtt0mY3xi6WJBD7jvs8Qt0Izlvbmns`);
        ws.onopen = () => {
            setLoading(false);
            SetSocket(ws);
        }
    },[]);

    return {
        socket ,
        loading
    }
}