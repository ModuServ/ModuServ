const PBKDF2_PREFIX = "pbkdf2:";
const ITERATIONS = 100_000;
const HASH_ALGO = "SHA-256";
const KEY_BITS = 256;

function hexEncode(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

export async function hashPassword(plaintext: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plaintext),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: HASH_ALGO },
    keyMaterial,
    KEY_BITS
  );

  return `${PBKDF2_PREFIX}${hexEncode(salt.buffer as ArrayBuffer)}:${hexEncode(hashBuf)}`;
}

export async function verifyPassword(plaintext: string, stored: string): Promise<boolean> {
  // Plaintext fallback for passwords that haven't been migrated yet
  if (!stored.startsWith(PBKDF2_PREFIX)) {
    return plaintext === stored;
  }

  const parts = stored.slice(PBKDF2_PREFIX.length).split(":");
  if (parts.length !== 2) return false;

  const [saltHex, storedHashHex] = parts;

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(plaintext),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const hashBuf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexDecode(saltHex), iterations: ITERATIONS, hash: HASH_ALGO },
    keyMaterial,
    KEY_BITS
  );

  return hexEncode(hashBuf) === storedHashHex;
}

export function isHashed(stored: string): boolean {
  return stored.startsWith(PBKDF2_PREFIX);
}
