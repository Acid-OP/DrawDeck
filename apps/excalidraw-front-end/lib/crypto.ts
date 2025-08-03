export async function generateAESKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  const rawKey = await crypto.subtle.exportKey("raw", key);
  const base64Key = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
  return base64Key;
}
