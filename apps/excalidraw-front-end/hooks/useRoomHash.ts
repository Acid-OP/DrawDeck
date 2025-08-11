import { useEffect, useState } from "react";
export function useRoomHash() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      
      if (hash.startsWith("#room=")) {
        const data = hash.replace("#room=", "");
        const [id, key] = data.split(",");
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