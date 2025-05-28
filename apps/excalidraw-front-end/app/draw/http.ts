import { BACKEND_URL } from "@/config";
import axios from "axios";


export async function getExistingShapes(roomId:string){
    const res = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
    const messages = res.data.messages;

    const shapes = messages.map((x : {message:string}) =>{
        const messageData = JSON.parse(x.message)
        return messageData.shape
    })
    return shapes;
}