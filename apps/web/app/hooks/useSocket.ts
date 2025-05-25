import { useEffect, useState } from "react";
import { WS_URL } from "../room/[slug]/config";


export function useSocket(){
    const [loading , setLoading] = useState(true);
    const [socket , SetSocket] = useState<WebSocket>();

    useEffect(()=>{
        const ws = new WebSocket(WS_URL);
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