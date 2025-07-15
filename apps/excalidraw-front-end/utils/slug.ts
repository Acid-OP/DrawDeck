// utils/slug.ts
export function encodeRoomId(roomName: string): string {
  return btoa(roomName); // Base64 encode
}

export function decodeSlug(slug: string): string | null {
  try {
    return atob(slug); // Base64 decode
  } catch (e) {
    console.error("Invalid slug:", slug);
    return null;
  }
}
