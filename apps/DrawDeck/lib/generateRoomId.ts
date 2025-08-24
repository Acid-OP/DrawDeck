export function generateRoomId(): string {
  const part1 = Math.random().toString(36).slice(2, 10);
  const part2 = Math.random().toString(36).slice(2, 6);
  return part1 + part2;
}
