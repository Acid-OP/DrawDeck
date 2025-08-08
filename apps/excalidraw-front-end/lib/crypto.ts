export async function generateAESKey(): Promise<string> {
  // Check if we're in a browser environment and crypto.subtle is available
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const key = await window.crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256,
        },
        true,
        ["encrypt", "decrypt"]
      );

      const rawKey = await window.crypto.subtle.exportKey("raw", key);
      const base64Key = btoa(String.fromCharCode(...new Uint8Array(rawKey)));
      return base64Key;
    } catch (error) {
      console.warn('crypto.subtle.generateKey failed, falling back to manual generation:', error);
    }
  }
  
  // Fallback: Generate a pseudo-random 32-byte key
  console.warn('Web Crypto API not available, using fallback key generation');
  return generateFallbackKey();
}

// Fallback function for when Web Crypto API is not available
export function generateFallbackKey(): string {
  // Use crypto.getRandomValues if available (works even without HTTPS)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    try {
      const keyArray = new Uint8Array(32);
      window.crypto.getRandomValues(keyArray);
      return btoa(String.fromCharCode(...keyArray));
    } catch (error) {
      console.warn('crypto.getRandomValues failed, using Math.random fallback');
    }
  }
  
  // Ultimate fallback using Math.random (less secure but functional)
  const keyArray = new Uint8Array(32);
  for (let i = 0; i < keyArray.length; i++) {
    keyArray[i] = Math.floor(Math.random() * 256);
  }
  return btoa(String.fromCharCode(...keyArray));
}

// Simple function that always works
export async function generateSecureKey(): Promise<string> {
  return generateAESKey(); // This now has built-in fallbacks
}