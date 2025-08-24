export async function getExistingShapes(roomId: number) {
  const data = localStorage.getItem(`shapes_${roomId}`);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse shapes from localStorage", e);
    return [];
  }
}