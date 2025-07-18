import { RoomCanvas } from "@/components/RoomCanvas";

export default async function CanvasPage({ params }: { params: { slug: string } }) {
  const p = await params;
  const roomName = (p.slug); // Directly use slug
  return <RoomCanvas slug={roomName} />;
}
