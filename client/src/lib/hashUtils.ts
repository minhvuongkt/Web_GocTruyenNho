/**
 * Utility functions for hashing and unhashing IDs in URLs
 * 
 * These functions allow us to transform numeric IDs into more complex strings
 * for better security and aesthetics in user-facing URLs.
 */

// Store a map of hashed values to original IDs for unhashing
const hashMap = new Map<string, number>();

/**
 * Generate an MD5 hash from a string
 * This is a browser-compatible implementation of MD5
 */
function md5(input: string): string {
  // Simple browser-compatible MD5 implementation
  function add32(a: number, b: number): number {
    return (a + b) & 0xFFFFFFFF;
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function md5cycle(x: number[], a: number[]): number[] {
    let a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];

    a0 = ff(a0, a1, a2, a3, x[0], 7, -680876936);
    a3 = ff(a3, a0, a1, a2, x[1], 12, -389564586);
    a2 = ff(a2, a3, a0, a1, x[2], 17, 606105819);
    a1 = ff(a1, a2, a3, a0, x[3], 22, -1044525330);
    a0 = ff(a0, a1, a2, a3, x[4], 7, -176418897);
    a3 = ff(a3, a0, a1, a2, x[5], 12, 1200080426);
    a2 = ff(a2, a3, a0, a1, x[6], 17, -1473231341);
    a1 = ff(a1, a2, a3, a0, x[7], 22, -45705983);
    a0 = ff(a0, a1, a2, a3, x[8], 7, 1770035416);
    a3 = ff(a3, a0, a1, a2, x[9], 12, -1958414417);
    a2 = ff(a2, a3, a0, a1, x[10], 17, -42063);
    a1 = ff(a1, a2, a3, a0, x[11], 22, -1990404162);
    a0 = ff(a0, a1, a2, a3, x[12], 7, 1804603682);
    a3 = ff(a3, a0, a1, a2, x[13], 12, -40341101);
    a2 = ff(a2, a3, a0, a1, x[14], 17, -1502002290);
    a1 = ff(a1, a2, a3, a0, x[15], 22, 1236535329);

    a0 = gg(a0, a1, a2, a3, x[1], 5, -165796510);
    a3 = gg(a3, a0, a1, a2, x[6], 9, -1069501632);
    a2 = gg(a2, a3, a0, a1, x[11], 14, 643717713);
    a1 = gg(a1, a2, a3, a0, x[0], 20, -373897302);
    a0 = gg(a0, a1, a2, a3, x[5], 5, -701558691);
    a3 = gg(a3, a0, a1, a2, x[10], 9, 38016083);
    a2 = gg(a2, a3, a0, a1, x[15], 14, -660478335);
    a1 = gg(a1, a2, a3, a0, x[4], 20, -405537848);
    a0 = gg(a0, a1, a2, a3, x[9], 5, 568446438);
    a3 = gg(a3, a0, a1, a2, x[14], 9, -1019803690);
    a2 = gg(a2, a3, a0, a1, x[3], 14, -187363961);
    a1 = gg(a1, a2, a3, a0, x[8], 20, 1163531501);
    a0 = gg(a0, a1, a2, a3, x[13], 5, -1444681467);
    a3 = gg(a3, a0, a1, a2, x[2], 9, -51403784);
    a2 = gg(a2, a3, a0, a1, x[7], 14, 1735328473);
    a1 = gg(a1, a2, a3, a0, x[12], 20, -1926607734);

    a0 = hh(a0, a1, a2, a3, x[5], 4, -378558);
    a3 = hh(a3, a0, a1, a2, x[8], 11, -2022574463);
    a2 = hh(a2, a3, a0, a1, x[11], 16, 1839030562);
    a1 = hh(a1, a2, a3, a0, x[14], 23, -35309556);
    a0 = hh(a0, a1, a2, a3, x[1], 4, -1530992060);
    a3 = hh(a3, a0, a1, a2, x[4], 11, 1272893353);
    a2 = hh(a2, a3, a0, a1, x[7], 16, -155497632);
    a1 = hh(a1, a2, a3, a0, x[10], 23, -1094730640);
    a0 = hh(a0, a1, a2, a3, x[13], 4, 681279174);
    a3 = hh(a3, a0, a1, a2, x[0], 11, -358537222);
    a2 = hh(a2, a3, a0, a1, x[3], 16, -722521979);
    a1 = hh(a1, a2, a3, a0, x[6], 23, 76029189);
    a0 = hh(a0, a1, a2, a3, x[9], 4, -640364487);
    a3 = hh(a3, a0, a1, a2, x[12], 11, -421815835);
    a2 = hh(a2, a3, a0, a1, x[15], 16, 530742520);
    a1 = hh(a1, a2, a3, a0, x[2], 23, -995338651);

    a0 = ii(a0, a1, a2, a3, x[0], 6, -198630844);
    a3 = ii(a3, a0, a1, a2, x[7], 10, 1126891415);
    a2 = ii(a2, a3, a0, a1, x[14], 15, -1416354905);
    a1 = ii(a1, a2, a3, a0, x[5], 21, -57434055);
    a0 = ii(a0, a1, a2, a3, x[12], 6, 1700485571);
    a3 = ii(a3, a0, a1, a2, x[3], 10, -1894986606);
    a2 = ii(a2, a3, a0, a1, x[10], 15, -1051523);
    a1 = ii(a1, a2, a3, a0, x[1], 21, -2054922799);
    a0 = ii(a0, a1, a2, a3, x[8], 6, 1873313359);
    a3 = ii(a3, a0, a1, a2, x[15], 10, -30611744);
    a2 = ii(a2, a3, a0, a1, x[6], 15, -1560198380);
    a1 = ii(a1, a2, a3, a0, x[13], 21, 1309151649);
    a0 = ii(a0, a1, a2, a3, x[4], 6, -145523070);
    a3 = ii(a3, a0, a1, a2, x[11], 10, -1120210379);
    a2 = ii(a2, a3, a0, a1, x[2], 15, 718787259);
    a1 = ii(a1, a2, a3, a0, x[9], 21, -343485551);

    a[0] = add32(a0, a[0]);
    a[1] = add32(a1, a[1]);
    a[2] = add32(a2, a[2]);
    a[3] = add32(a3, a[3]);

    return a;
  }

  function md5blk(s: string): number[] {
    const md5blks = [];
    let i;

    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) +
        (s.charCodeAt(i + 1) << 8) +
        (s.charCodeAt(i + 2) << 16) +
        (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }

  function md51(s: string): number[] {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i;

    for (i = 64; i <= s.length; i += 64) {
      md5cycle(md5blk(s.substring(i - 64, i)), state);
    }

    s = s.substring(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (i = 0; i < s.length; i++) {
      tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    }

    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(tail, state);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }

    tail[14] = n * 8;
    md5cycle(tail, state);
    return state;
  }

  function rhex(n: number): string {
    let s = '';
    let j;
    for (j = 0; j < 4; j++) {
      s += ((n >> (j * 8 + 4)) & 0x0F).toString(16) + 
           ((n >> (j * 8)) & 0x0F).toString(16);
    }
    return s;
  }

  function hex(x: number[]): string {
    const result: string[] = [];
    for (let i = 0; i < x.length; i++) {
      result[i] = rhex(x[i]);
    }
    return result.join('');
  }
  
  return hex(md51(input));
}

/**
 * Hash a numerical ID to a string for URL display
 * Using MD5 for longer, more complex IDs
 */
export function hashId(id: number): string {
  // Add some salt to make it harder to guess the original ID
  const salt = "truyenhay:";
  const hashInput = `${salt}${id}`;
  
  // Generate MD5 hash and add a prefix for our app
  const hashed = `t-${md5(hashInput)}`;
  
  // Store the mapping to make unhashing more efficient
  hashMap.set(hashed, id);
  
  return hashed;
}

/**
 * Convert a hashed ID back to its original numerical value
 */
export function unhashId(hash: string): number {
  try {
    // If we have it stored in our map, return it directly
    if (hashMap.has(hash)) {
      return hashMap.get(hash) || 0;
    }
    
    // Otherwise, check if it's a base64 simple hash from the old system
    if (hash.startsWith('t-')) {
      const encoded = hash.substring(2);
      try {
        // Try to decode as base64 (old format)
        const decoded = atob(encoded);
        const id = parseInt(decoded, 10);
        if (!isNaN(id)) {
          return id;
        }
      } catch (e) {
        // Not base64, continue with our logic
      }
    }
    
    // For MD5 hashes, we'd need to have seen them before to be able to reverse
    // So we'll just attempt to decode as an integer directly if nothing else works
    return parseInt(hash, 10);
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