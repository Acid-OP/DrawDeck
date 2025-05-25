import { BACKEND_URL } from "../room/[slug]/config";
import axios from "axios";
async function getChats(roomId:string){
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
    return response.data.messages
}

export async function ChatRoom({id}:{
    id:string
}){
    const messages = await getChats(id);
}