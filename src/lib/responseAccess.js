const ITERATIONS = 600_000;
const encoder = new TextEncoder();

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveHash(password, salt, iterations) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, material, 256);
  return new Uint8Array(bits);
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

export async function createResponsePasswordVerifier(password) {
  const normalized = String(password || "");
  if (normalized.length < 8) throw new Error("password_too_short");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(normalized, salt, ITERATIONS);
  return {
    version: 1,
    algorithm: "PBKDF2-HMAC-SHA256",
    iterations: ITERATIONS,
    salt: bytesToBase64(salt),
    hash: bytesToBase64(hash),
  };
}

export async function verifyResponsePassword(verifier, password) {
  if (!verifier?.salt || !verifier?.hash || !Number.isInteger(verifier?.iterations)) return true;
  try {
    const actual = await deriveHash(String(password || ""), base64ToBytes(verifier.salt), verifier.iterations);
    return constantTimeEqual(actual, base64ToBytes(verifier.hash));
  } catch {
    return false;
  }
}
