export async function generateAESKey(): Promise<string> {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('generateAESKey can only be called on the client side');
  }

  // Check if Web Crypto API is available
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available. This requires HTTPS or localhost.');
  }

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
    console.error('Error generating AES key:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate AES key: ${errorMessage}`);
  }
}

// Fallback function for when Web Crypto API is not available
export function generateFallbackKey(): string {
  console.warn('Using fallback key generation - less secure than Web Crypto API');
  
  // Generate a random 32-byte key
  const keyArray = new Uint8Array(32);
  
  // Use crypto.getRandomValues if available, otherwise use Math.random (less secure)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(keyArray);
  } else {
    // Fallback to Math.random (not cryptographically secure)
    for (let i = 0; i < keyArray.length; i++) {
      keyArray[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to base64
  const base64Key = btoa(String.fromCharCode(...keyArray));
  return base64Key;
}

// Main function that tries secure method first, then falls back
export async function generateSecureKey(): Promise<string> {
  try {
    return await generateAESKey();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown crypto error';
    console.warn('Secure key generation failed, using fallback:', errorMessage);
    return generateFallbackKey();
  }
}