// Doujindesu Cryptographic Utilities (Ported from the site's JS bundle)
// Responsible solely for XOR key derivation and ciphertext decryption.
// 100% pure crypto logic — no network, no cache, no state mutation.

/**
 * Key generator: hash a string seed into 32 printable ASCII characters.
 * @param {string} s - Seed string (e.g. `${salt}_${bucket}`)
 * @returns {string} 32-character key
 */
export function generateKey(s) {
  let hash = 0;
  for (let n = 0; n < s.length; n++) {
    hash = (hash << 5) - hash + s.charCodeAt(n);
    hash |= 0;
  }
  let out = '';
  let x = Math.abs(hash) || 123456789;
  for (let n = 0; n < 32; n++) {
    x = (x * 1664525 + 1013904223) % 4294967296;
    out += String.fromCharCode(33 + (x % 93));
  }
  return out;
}

/**
 * Chained XOR decryption on a hex-encoded ciphertext.
 * @param {string} hex - Hexadecimal ciphertext string
 * @param {string} key - Derived encryption key
 * @returns {string} Plaintext string
 */
export function decryptHex(hex, key) {
  if (typeof hex !== 'string' || !hex) return '';
  const bytes = [];
  for (let d = 0; d < hex.length; d += 2) {
    const w = hex.substring(d, d + 2);
    if (!w) break;
    bytes.push(parseInt(w, 16));
  }
  const out = [];
  const keyLen = key.length;
  let n = 42;
  for (let d = 0; d < bytes.length; d++) {
    const w = bytes[d];
    const p = key.charCodeAt(d % keyLen);
    const ch = w ^ p ^ (d * 13) ^ n;
    out.push(String.fromCharCode(ch & 255));
    n = (n + w) % 256;
  }
  return out.join('');
}

/**
 * Generates candidate keys across 1-hour time buckets [current, bucket - 1, bucket + 1].
 * @param {string} salt - Secret salt configured for Doujindesu
 * @param {() => number} [dateNowFn=Date.now] - Hook to provide current timestamp (for testing)
 * @returns {string[]} Candidate keys for decryption
 */
export function candidateKeys(salt, dateNowFn = Date.now) {
  const bucket = Math.floor(dateNowFn() / 3600000);
  return [bucket, bucket - 1, bucket + 1].map((b) => generateKey(`${salt}_${b}`));
}

/**
 * Attempts to decrypt an encrypted response payload using candidate time-bucket keys.
 * @param {string} enc - Hex-encoded payload from _enc_resp_
 * @param {string} salt - Secret salt configured for Doujindesu
 * @param {() => number} [dateNowFn=Date.now] - Optional timestamp getter
 * @returns {any} Decrypted JSON object
 */
export function decryptResponse(enc, salt, dateNowFn = Date.now) {
  for (const key of candidateKeys(salt, dateNowFn)) {
    try {
      const decrypted = decryptHex(enc, key);
      return JSON.parse(decodeURIComponent(decrypted));
    } catch {
      // try the next key
    }
  }
  throw new Error('Failed to decrypt server response (check DOUJIN_APP_SECRET / DOUJIN_SALT)');
}
