
import { RoomCanvas } from "@/components/RoomCanvas";


export default async function CanvasPage(
  { params }: { params: { slug: string } }
) {
  const { slug } = await params; 
  return <RoomCanvas slug={slug} />;
}
