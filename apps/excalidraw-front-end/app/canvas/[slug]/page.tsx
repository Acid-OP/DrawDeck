// Remove this import
// import { decodeSlug } from "@/utils/slug";

import { RoomCanvas } from "@/components/RoomCanvas";

export default async function CanvasPage({ params }: { params: { slug: string } }) {
  const roomName = (await params.slug); // Directly use slug
  return <RoomCanvas slug={roomName} />;
}
