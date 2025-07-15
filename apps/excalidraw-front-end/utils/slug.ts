export function encodeRoomId(roomName: string): string {
  return btoa(roomName); // base64
}

export function decodeSlug(slug: string): string | null {
  try {
    return atob(slug); // base64 decode
  } catch (e) {
    console.error("Invalid slug:", slug);
    return null;
  }
}
