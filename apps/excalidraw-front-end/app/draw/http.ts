import { BACKEND_URL } from "@/config";
import axios from "axios";

export async function getExistingShapes(roomId: number) {
  const { data } = await axios.get(
    `${BACKEND_URL}/shapes/${roomId}`,
    {
      headers: {
        Authorization: localStorage.getItem("token") ?? "",
      },
    },
  );
  return data.shapes as any[];
}