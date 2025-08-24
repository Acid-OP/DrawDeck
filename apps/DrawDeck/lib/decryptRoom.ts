export async function decryptRoomId(encryptedKey: string, encryptedRoomId: string): Promise<string | null> {
  try {
    const keyBuffer = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const [ivBase64, cipherTextBase64] = encryptedRoomId.split(":");
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const cipherText = Uint8Array.from(atob(cipherTextBase64), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherText
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    console.error("Decryption failed:", err);
    return null;
  }
}
