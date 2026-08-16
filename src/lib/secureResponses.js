const PRIVATE_KEY_PREFIX = "cokform:e2ee:private:";
const VERSION = 1;

function assertCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("이 브라우저는 안전한 암호화를 지원하지 않습니다.");
  }
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function exportJwk(key) {
  return crypto.subtle.exportKey("jwk", key);
}

async function importPublicKey(jwk) {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, []);
}

async function importPrivateKey(jwk) {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
}

async function deriveResponseKey(privateKey, publicKey) {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function ensureFormKeyPair(formId) {
  assertCrypto();
  const stored = localStorage.getItem(`${PRIVATE_KEY_PREFIX}${formId}`);
  if (stored) {
    const privateJwk = JSON.parse(stored);
    const privateKey = await importPrivateKey(privateJwk);
    return { privateKey, privateJwk, publicJwk: { ...privateJwk, d: undefined, key_ops: [] } };
  }

  const pair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );
  const privateJwk = await exportJwk(pair.privateKey);
  const publicJwk = await exportJwk(pair.publicKey);
  localStorage.setItem(`${PRIVATE_KEY_PREFIX}${formId}`, JSON.stringify(privateJwk));
  return { privateKey: pair.privateKey, privateJwk, publicJwk };
}

export async function getStoredPrivateKey(formId) {
  assertCrypto();
  const stored = localStorage.getItem(`${PRIVATE_KEY_PREFIX}${formId}`);
  return stored ? importPrivateKey(JSON.parse(stored)) : null;
}

export async function encryptAnswers(publicJwk, answers) {
  assertCrypto();
  const recipientPublic = await importPublicKey(publicJwk);
  const ephemeral = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );
  const key = await deriveResponseKey(ephemeral.privateKey, recipientPublic);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(answers));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    version: VERSION,
    algorithm: "ECDH-P256/AES-256-GCM",
    ephemeralPublicKey: await exportJwk(ephemeral.publicKey),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptAnswers(formId, envelope) {
  if (!envelope || envelope.version !== VERSION) return null;
  const privateKey = await getStoredPrivateKey(formId);
  if (!privateKey) return null;
  const ephemeralPublic = await importPublicKey(envelope.ephemeralPublicKey);
  const key = await deriveResponseKey(privateKey, ephemeralPublic);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(envelope.iv) },
    key,
    base64ToBytes(envelope.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export function isEncryptedEnvelope(value) {
  return Boolean(value && value.version === VERSION && value.ciphertext && value.iv);
}
