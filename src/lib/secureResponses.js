const LEGACY_PRIVATE_KEY_PREFIX = "cokform:e2ee:private:";
const KEY_VAULT_PREFIX = "cokform:e2ee:vault:";
const ENVELOPE_VERSION = 2;
const LEGACY_ENVELOPE_VERSION = 1;
const VAULT_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;
const memoryPrivateKeys = new Map();
const SESSION_UNLOCK_PREFIX = "cokform:e2ee:session-unlock:";
const SESSION_UNLOCK_DB = "cokform-e2ee-session-keys";
const SESSION_UNLOCK_STORE = "keys";

function readSessionValue(key) {
  try {
    return sessionStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

function writeSessionValue(key, value) {
  try {
    if (value) sessionStorage.setItem(key, value);
    else sessionStorage.removeItem(key);
  } catch {
    // Session restore is optional. The encrypted vault remains the source of truth.
  }
}

function openSessionKeyDatabase() {
  if (!globalThis.indexedDB) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SESSION_UNLOCK_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(SESSION_UNLOCK_STORE)) request.result.createObjectStore(SESSION_UNLOCK_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("session_key_store_open_failed"));
  });
}

function readSessionKeyRecord(db, id) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(SESSION_UNLOCK_STORE, "readonly").objectStore(SESSION_UNLOCK_STORE).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error || new Error("session_key_store_read_failed"));
  });
}

function writeSessionKeyRecord(db, record) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(SESSION_UNLOCK_STORE, "readwrite").objectStore(SESSION_UNLOCK_STORE).put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("session_key_store_write_failed"));
  });
}

function deleteSessionKeyRecord(db, id) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(SESSION_UNLOCK_STORE, "readwrite").objectStore(SESSION_UNLOCK_STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("session_key_store_delete_failed"));
  });
}

function newSessionKeyHandle() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function rememberSessionPrivateKey(formId, privateKey, publicJwk) {
  const sessionKey = `${SESSION_UNLOCK_PREFIX}${formId}`;
  const handle = readSessionValue(sessionKey) || newSessionKeyHandle();
  writeSessionValue(sessionKey, handle);
  const db = await openSessionKeyDatabase();
  if (!db) return;
  try {
    // CryptoKey is non-extractable. Only this origin and this browser session handle can use it.
    await writeSessionKeyRecord(db, { id: handle, formId, privateKey, publicJwk, createdAt: Date.now() });
  } finally {
    db.close();
  }
}

async function forgetSessionPrivateKey(formId) {
  const sessionKey = `${SESSION_UNLOCK_PREFIX}${formId}`;
  const handle = readSessionValue(sessionKey);
  writeSessionValue(sessionKey, null);
  if (!handle) return;
  const db = await openSessionKeyDatabase();
  if (!db) return;
  try {
    await deleteSessionKeyRecord(db, handle);
  } finally {
    db.close();
  }
}

function assertCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("이 브라우저는 안전한 암호화를 지원하지 않습니다.");
  }
}

function keyError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function encode(value) {
  return new TextEncoder().encode(value);
}

function normalizePassphrase(value) {
  return String(value || "").normalize("NFKC");
}

function publicJwkFromPrivate(privateJwk) {
  const { d: _private, key_ops: _ops, ...publicJwk } = privateJwk || {};
  return { ...publicJwk, key_ops: [] };
}

function vaultAad(formId) {
  return encode(`cokform:key-vault:v${VAULT_VERSION}:${formId}`);
}

function envelopeAad(formId, purpose) {
  return encode(`cokform:response-envelope:v${ENVELOPE_VERSION}:${formId}:${purpose}`);
}

async function exportJwk(key) {
  return crypto.subtle.exportKey("jwk", key);
}

async function importPublicKey(jwk) {
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, true, []);
}

async function importPrivateKey(jwk) {
  // The private key is deliberately non-extractable after an unlock. Code can
  // derive a response key, but cannot export the private material again.
  return crypto.subtle.importKey("jwk", jwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]);
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

async function deriveVaultKey(passphrase, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    encode(normalizePassphrase(passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: PBKDF2_ITERATIONS,
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readVault(formId) {
  const vault = readJson(`${KEY_VAULT_PREFIX}${formId}`);
  if (!vault || vault.version !== VAULT_VERSION || !vault.salt || !vault.iv || !vault.ciphertext) return null;
  return vault;
}

async function wrapPrivateJwk(formId, privateJwk, passphrase) {
  assertCrypto();
  const normalized = normalizePassphrase(passphrase);
  if (normalized.length < 12) {
    throw keyError("weak_recovery_password", "복구 비밀번호는 12자 이상으로 설정해 주세요.");
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrappingKey = await deriveVaultKey(normalized, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: vaultAad(formId), tagLength: 128 },
    wrappingKey,
    encode(JSON.stringify(privateJwk)),
  );
  return {
    version: VAULT_VERSION,
    algorithm: "PBKDF2-HMAC-SHA256/AES-256-GCM",
    iterations: PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    createdAt: new Date().toISOString(),
  };
}

async function unwrapPrivateJwk(formId, vault, passphrase) {
  assertCrypto();
  const normalized = normalizePassphrase(passphrase);
  if (!normalized) throw keyError("missing_recovery_password", "복구 비밀번호를 입력해 주세요.");
  try {
    const wrappingKey = await deriveVaultKey(normalized, base64ToBytes(vault.salt));
    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBytes(vault.iv),
        additionalData: vaultAad(formId),
        tagLength: 128,
      },
      wrappingKey,
      base64ToBytes(vault.ciphertext),
    );
    const privateJwk = JSON.parse(new TextDecoder().decode(plaintext));
    if (!privateJwk?.d || privateJwk.kty !== "EC") throw new Error("invalid_private_key");
    return privateJwk;
  } catch {
    throw keyError("invalid_recovery_password", "복구 비밀번호가 맞지 않거나 키 백업이 손상됐습니다.");
  }
}

function cachePrivateKey(formId, privateJwk, privateKey) {
  memoryPrivateKeys.set(formId, { privateJwk, privateKey, publicJwk: publicJwkFromPrivate(privateJwk) });
}

/**
 * Returns the protection state without exposing key material.
 * `legacy_unprotected` is only present for data created before the key vault.
 */
export function getFormKeyVaultState(formId) {
  if (memoryPrivateKeys.has(formId)) return "unlocked";
  if (readVault(formId)) return "locked";
  if (localStorage.getItem(`${LEGACY_PRIVATE_KEY_PREFIX}${formId}`)) return "legacy_unprotected";
  return "setup_required";
}

export function isFormKeyUnlocked(formId) {
  return memoryPrivateKeys.has(formId);
}

export async function restoreFormKeyVaultSession(formId) {
  const cached = memoryPrivateKeys.get(formId);
  if (cached) return { privateKey: cached.privateKey, publicJwk: cached.publicJwk };
  const sessionKey = `${SESSION_UNLOCK_PREFIX}${formId}`;
  const handle = readSessionValue(sessionKey);
  if (!handle) return null;
  try {
    const db = await openSessionKeyDatabase();
    if (!db) return null;
    let record;
    try {
      record = await readSessionKeyRecord(db, handle);
    } finally {
      db.close();
    }
    if (!record || record.formId !== formId || !record.privateKey || !record.publicJwk) {
      writeSessionValue(sessionKey, null);
      return null;
    }
    memoryPrivateKeys.set(formId, { privateKey: record.privateKey, publicJwk: record.publicJwk });
    return { privateKey: record.privateKey, publicJwk: record.publicJwk };
  } catch {
    return null;
  }
}

export function lockFormKeyVault(formId) {
  memoryPrivateKeys.delete(formId);
  void forgetSessionPrivateKey(formId).catch(() => {});
}

/**
 * Creates a new per-form ECDH key or migrates the former plaintext local key,
 * then stores only a passphrase-encrypted vault record in persistent storage.
 */
export async function setupFormKeyVault(formId, passphrase) {
  assertCrypto();
  const existing = readVault(formId);
  if (existing) return unlockFormKeyVault(formId, passphrase);

  let privateJwk = readJson(`${LEGACY_PRIVATE_KEY_PREFIX}${formId}`);
  if (!privateJwk?.d) {
    const pair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey"],
    );
    privateJwk = await exportJwk(pair.privateKey);
  }

  const vault = await wrapPrivateJwk(formId, privateJwk, passphrase);
  localStorage.setItem(`${KEY_VAULT_PREFIX}${formId}`, JSON.stringify(vault));
  localStorage.removeItem(`${LEGACY_PRIVATE_KEY_PREFIX}${formId}`);
  const privateKey = await importPrivateKey(privateJwk);
  const publicJwk = publicJwkFromPrivate(privateJwk);
  cachePrivateKey(formId, privateJwk, privateKey);
  await rememberSessionPrivateKey(formId, privateKey, publicJwk).catch(() => {});
  return { privateKey, publicJwk };
}

export async function unlockFormKeyVault(formId, passphrase) {
  assertCrypto();
  const cached = memoryPrivateKeys.get(formId);
  if (cached) return { privateKey: cached.privateKey, publicJwk: cached.publicJwk };
  const vault = readVault(formId);
  if (!vault) throw keyError("key_vault_missing", "이 기기에 복구 가능한 개인키가 없습니다. 암호화된 키 백업을 가져와 주세요.");
  const privateJwk = await unwrapPrivateJwk(formId, vault, passphrase);
  const privateKey = await importPrivateKey(privateJwk);
  const publicJwk = publicJwkFromPrivate(privateJwk);
  cachePrivateKey(formId, privateJwk, privateKey);
  await rememberSessionPrivateKey(formId, privateKey, publicJwk).catch(() => {});
  return { privateKey, publicJwk };
}

export async function changeFormKeyVaultPassphrase(formId, currentPassphrase, nextPassphrase) {
  const vault = readVault(formId);
  if (!vault) throw keyError("key_vault_missing", "먼저 개인키 금고를 설정해 주세요.");
  const privateJwk = await unwrapPrivateJwk(formId, vault, currentPassphrase);
  const nextVault = await wrapPrivateJwk(formId, privateJwk, nextPassphrase);
  localStorage.setItem(`${KEY_VAULT_PREFIX}${formId}`, JSON.stringify(nextVault));
  const privateKey = await importPrivateKey(privateJwk);
  const publicJwk = publicJwkFromPrivate(privateJwk);
  cachePrivateKey(formId, privateJwk, privateKey);
  await rememberSessionPrivateKey(formId, privateKey, publicJwk).catch(() => {});
  return { privateKey, publicJwk };
}

/**
 * A recovery export contains an already encrypted vault copy only. The raw
 * private JWK, the recovery passphrase, and response plaintext never enter it.
 */
export function exportEncryptedKeyBackup(formId) {
  const vault = readVault(formId);
  if (!vault) throw keyError("key_vault_missing", "먼저 개인키 금고를 설정해 주세요.");
  return {
    format: "cokform-encrypted-key-backup",
    version: 1,
    formId,
    exportedAt: new Date().toISOString(),
    vault,
  };
}

export function importEncryptedKeyBackup(backup) {
  if (backup?.format !== "cokform-encrypted-key-backup" || backup?.version !== 1 || !backup.formId || !backup.vault) {
    throw keyError("invalid_key_backup", "Cokform 암호화 키 백업 파일이 아닙니다.");
  }
  const vault = backup.vault;
  if (vault.version !== VAULT_VERSION || !vault.salt || !vault.iv || !vault.ciphertext) {
    throw keyError("invalid_key_backup", "키 백업 내용이 손상됐습니다.");
  }
  localStorage.setItem(`${KEY_VAULT_PREFIX}${backup.formId}`, JSON.stringify(vault));
  localStorage.removeItem(`${LEGACY_PRIVATE_KEY_PREFIX}${backup.formId}`);
  lockFormKeyVault(backup.formId);
  return backup.formId;
}

function recoveryDataAad(formId) {
  return encode(`cokform:recovery-data:v1:${formId}`);
}

/**
 * Creates a portable disaster-recovery bundle without decrypting the stored
 * responses. It contains the already encrypted key vault and a separately
 * passphrase-encrypted copy of form metadata, response envelopes and versions.
 */
export async function createEncryptedFormRecoveryBundle(formId, payload, passphrase) {
  const keyVault = readVault(formId);
  if (!keyVault) throw keyError("key_vault_missing", "먼저 개인키 금고를 설정해 주세요.");
  // Verify that the caller knows the recovery password before allowing export.
  await unwrapPrivateJwk(formId, keyVault, passphrase);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveVaultKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: recoveryDataAad(formId), tagLength: 128 },
    key,
    encode(JSON.stringify(payload)),
  );
  return {
    format: "cokform-encrypted-form-recovery",
    version: 1,
    formId,
    exportedAt: new Date().toISOString(),
    keyVault,
    data: {
      algorithm: "PBKDF2-HMAC-SHA256/AES-256-GCM",
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    },
  };
}

export async function openEncryptedFormRecoveryBundle(bundle, passphrase) {
  if (bundle?.format !== "cokform-encrypted-form-recovery" || bundle?.version !== 1 || !bundle.formId || !bundle.keyVault || !bundle.data) {
    throw keyError("invalid_recovery_bundle", "Cokform 암호화 복구 번들 파일이 아닙니다.");
  }
  const { data } = bundle;
  if (!data.salt || !data.iv || !data.ciphertext) throw keyError("invalid_recovery_bundle", "복구 번들 내용이 손상됐습니다.");
  // Decrypting the vault first validates both the recovery password and the key
  // binding before any database payload is accepted.
  await unwrapPrivateJwk(bundle.formId, bundle.keyVault, passphrase);
  try {
    const key = await deriveVaultKey(passphrase, base64ToBytes(data.salt));
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToBytes(data.iv), additionalData: recoveryDataAad(bundle.formId), tagLength: 128 },
      key,
      base64ToBytes(data.ciphertext),
    );
    const payload = JSON.parse(new TextDecoder().decode(plaintext));
    if (payload?.formId !== bundle.formId || !payload?.form?.data?.form) throw new Error("invalid_payload");
    return payload;
  } catch {
    throw keyError("invalid_recovery_password", "복구 비밀번호가 맞지 않거나 복구 번들이 손상됐습니다.");
  }
}

export function importRecoveryBundleKeyVault(bundle) {
  return importEncryptedKeyBackup({
    format: "cokform-encrypted-key-backup",
    version: 1,
    formId: bundle?.formId,
    vault: bundle?.keyVault,
  });
}

// Compatibility guard: forms can only become editable after the user explicitly
// creates or unlocks their local key vault.
export async function ensureFormKeyPair(formId) {
  const cached = memoryPrivateKeys.get(formId);
  if (cached) return { privateKey: cached.privateKey, publicJwk: cached.publicJwk };
  const state = getFormKeyVaultState(formId);
  if (state === "locked") throw keyError("key_locked", "개인키 금고를 먼저 잠금 해제해 주세요.");
  if (state === "legacy_unprotected") throw keyError("key_migration_required", "기존 개인키를 암호화 금고로 보호해 주세요.");
  throw keyError("key_setup_required", "개인키 금고를 먼저 설정해 주세요.");
}

export async function getStoredPrivateKey(formId) {
  assertCrypto();
  return memoryPrivateKeys.get(formId)?.privateKey || null;
}

export async function encryptAnswers(publicJwk, answers, { formId = "", purpose = "response" } = {}) {
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
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: envelopeAad(formId, purpose), tagLength: 128 },
    key,
    plaintext,
  );
  return {
    version: ENVELOPE_VERSION,
    algorithm: "ECDH-P256/AES-256-GCM",
    ephemeralPublicKey: await exportJwk(ephemeral.publicKey),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptAnswers(formId, envelope, { purpose = "response" } = {}) {
  if (!envelope || ![LEGACY_ENVELOPE_VERSION, ENVELOPE_VERSION].includes(envelope.version)) return null;
  const privateKey = await getStoredPrivateKey(formId);
  if (!privateKey) return null;
  const ephemeralPublic = await importPublicKey(envelope.ephemeralPublicKey);
  const key = await deriveResponseKey(privateKey, ephemeralPublic);
  const params = envelope.version === ENVELOPE_VERSION
    ? { name: "AES-GCM", iv: base64ToBytes(envelope.iv), additionalData: envelopeAad(formId, purpose), tagLength: 128 }
    : { name: "AES-GCM", iv: base64ToBytes(envelope.iv) };
  const plaintext = await crypto.subtle.decrypt(params, key, base64ToBytes(envelope.ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export function isEncryptedEnvelope(value) {
  return Boolean(value && [LEGACY_ENVELOPE_VERSION, ENVELOPE_VERSION].includes(value.version) && value.ciphertext && value.iv);
}
