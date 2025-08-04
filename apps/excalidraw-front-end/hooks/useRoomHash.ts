import { useEffect, useState } from "react";
export function useRoomHash() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      console.log("Current hash:", hash); // Debug log
      
      if (hash.startsWith("#room=")) {
        const data = hash.replace("#room=", "");
        const [id, key] = data.split(",");
        console.log("Parsed roomId:", id, "key:", key); // Debug log
        setRoomId(id);
        setEncryptionKey(key);
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  return { roomId, encryptionKey };
}