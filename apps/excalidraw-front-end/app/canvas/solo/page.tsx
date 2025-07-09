// app/canvas/solo/page.tsx
"use client";

import { Canvas } from "@/components/Canvas";

export default function SoloCanvasPage() {
  return <Canvas roomId={-1} socket={null} isSolo={true} />;
}
