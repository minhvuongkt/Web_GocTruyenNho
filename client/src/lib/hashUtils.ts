/**
 * Utility functions for hashing and unhashing IDs in URLs
 * 
 * These functions allow us to transform numeric IDs into more complex strings
 * for better security and aesthetics in user-facing URLs.
 */

// Simple hashing for demo purposes using browser-compatible APIs
// In a production environment, consider using more complex hashing or encryption
export function hashId(id: number): string {
  // Convert number to string and encode it
  // Using a simpler algorithm that works in browsers without Buffer
  const str = id.toString();
  const encoded = btoa(str); // Base64 encoding in browser
  
  // Add a prefix to make it look less like a simple encoding
  return `t-${encoded}`;
}

export function unhashId(hash: string): number {
  try {
    // Remove the prefix
    const encoded = hash.startsWith('t-') ? hash.substring(2) : hash;
    // Decode back to string and convert to number
    const decoded = atob(encoded); // Base64 decoding in browser
    return parseInt(decoded, 10);
  } catch (error) {
    console.error('Failed to unhash ID:', error);
    return 0; // Return 0 or some invalid ID in case of error
  }
}

/**
 * Checks if a string is a hashed ID
 */
export function isHashedId(id: string): boolean {
  return id.startsWith('t-');
}

/**
 * Takes an ID (either a number or a hashed string) and returns a number
 */
export function normalizeId(id: string | number): number {
  if (typeof id === 'number') return id;
  return isHashedId(id) ? unhashId(id) : parseInt(id, 10);
}