import { createClient } from "npm:@supabase/supabase-js@2";

const CANONICAL_ORIGIN = "https://cokform.pages.dev";
const MAX_BODY_BYTES = 256 * 1024;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64_PATTERN = /^[a-z0-9+/]+={0,2}$/i;
const BASE64URL_PATTERN = /^[a-z0-9_-]+$/i;
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": CANONICAL_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, apikey",
  "Vary": "Origin",
};

type SubmitPayload = {
  id?: string;
  formId?: string;
  submittedAt?: string;
  answers?: {
    version?: number;
    algorithm?: string;
    ephemeralPublicKey?: { kty?: string; crv?: string; x?: string; y?: string };
    iv?: string;
    ciphertext?: string;
  };
  respondentToken?: string | null;
  turnstileToken?: string;
  formPassword?: string;
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function requestOriginAllowed(request: Request) {
  // Browser POST requests carry Origin. Rejecting absent or foreign origins blocks
  // normal cross-site form posts; Turnstile remains the primary bot defense.
  return request.headers.get("origin") === CANONICAL_ORIGIN;
}

function safeClientAddress(request: Request) {
  // This value is never stored. It is immediately HMAC-derived inside the trusted
  // function before being sent to Postgres for a short-lived rate-limit bucket.
  const cfAddress = request.headers.get("cf-connecting-ip")?.trim();
  if (cfAddress) return cfAddress;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

async function hmacFingerprint(secret: string, formId: string, address: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`cokform:response-rate-limit:v1:${formId}:${address}`),
  );
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function verifyFormPassword(verifier: Record<string, unknown> | undefined, suppliedPassword: string | undefined) {
  if (!verifier?.salt || !verifier?.hash || !Number.isInteger(verifier?.iterations)) return true;
  if (typeof suppliedPassword !== "string" || suppliedPassword.length < 1) return false;
  try {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(suppliedPassword), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64ToBytes(String(verifier.salt)),
      iterations: Number(verifier.iterations),
    }, material, 256);
    return constantTimeEqual(new Uint8Array(bits), base64ToBytes(String(verifier.hash)));
  } catch {
    return false;
  }
}

function isValidEnvelope(value: SubmitPayload["answers"]) {
  const key = value?.ephemeralPublicKey;
  return Boolean(
    value
      && value.version === 2
      && value.algorithm === "ECDH-P256/AES-256-GCM"
      && key?.kty === "EC"
      && key?.crv === "P-256"
      && typeof key.x === "string" && BASE64URL_PATTERN.test(key.x)
      && typeof key.y === "string" && BASE64URL_PATTERN.test(key.y)
      && typeof value.iv === "string" && BASE64_PATTERN.test(value.iv) && value.iv.length <= 64
      && typeof value.ciphertext === "string" && BASE64_PATTERN.test(value.ciphertext)
      && value.ciphertext.length > 0 && value.ciphertext.length <= MAX_BODY_BYTES,
  );
}

function isOpenForResponses(settings: Record<string, unknown> | undefined) {
  if (!settings || settings.acceptingResponses === false) return false;
  const now = Date.now();
  const start = typeof settings.responseStartAt === "string" ? Date.parse(settings.responseStartAt) : NaN;
  const end = typeof settings.responseEndAt === "string" ? Date.parse(settings.responseEndAt) : NaN;
  return (Number.isNaN(start) || start <= now) && (Number.isNaN(end) || end > now);
}

async function verifyTurnstile(secret: string, token: string, idempotencyKey: string, remoteIp: string) {
  if (!secret || !token) return false;
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  form.set("idempotency_key", idempotencyKey);
  if (remoteIp !== "unknown") form.set("remoteip", remoteIp);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  if (!response.ok) return false;
  const result = await response.json().catch(() => null);
  return result?.success === true && result?.hostname === "cokform.pages.dev";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (request.method !== "POST") return json(405, { ok: false, code: "method_not_allowed" });
  if (!requestOriginAllowed(request)) return json(403, { ok: false, code: "invalid_origin" });
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json(415, { ok: false, code: "invalid_content_type" });
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json(413, { ok: false, code: "payload_too_large" });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { ok: false, code: "payload_too_large" });

  let payload: SubmitPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json(400, { ok: false, code: "invalid_json" });
  }

  if (
    !UUID_V4_PATTERN.test(payload.id || "")
    || !UUID_V4_PATTERN.test(payload.formId || "")
    || !isValidEnvelope(payload.answers)
    || (payload.respondentToken !== null && payload.respondentToken !== undefined && !UUID_V4_PATTERN.test(payload.respondentToken))
    || typeof payload.turnstileToken !== "string"
    || payload.turnstileToken.length < 20
    || (payload.formPassword !== undefined && (typeof payload.formPassword !== "string" || payload.formPassword.length > 256))
  ) {
    return json(400, { ok: false, code: "invalid_submission" });
  }

  const submittedAt = typeof payload.submittedAt === "string" ? Date.parse(payload.submittedAt) : NaN;
  if (Number.isNaN(submittedAt) || Math.abs(Date.now() - submittedAt) > 5 * 60 * 1000) {
    return json(400, { ok: false, code: "invalid_submission_time" });
  }

  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!serviceRole || !supabaseUrl) return json(503, { ok: false, code: "service_unavailable" });

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data: turnstileSecret, error: turnstileSecretError } = await admin.rpc("read_cokform_turnstile_secret");
  if (turnstileSecretError || typeof turnstileSecret !== "string" || !turnstileSecret) {
    return json(503, { ok: false, code: "security_verification_unavailable" });
  }

  const remoteIp = safeClientAddress(request);
  const turnstileVerified = await verifyTurnstile(turnstileSecret, payload.turnstileToken, payload.id, remoteIp);
  if (!turnstileVerified) return json(403, { ok: false, code: "security_verification_failed" });

  const { data: publicForm, error: publicFormError } = await admin
    .from("form_public")
    .select("id,data")
    .eq("id", payload.formId)
    .maybeSingle();
  if (publicFormError || !publicForm || !isOpenForResponses(publicForm.data?.settings)) {
    return json(409, { ok: false, code: "form_unavailable" });
  }
  const passwordVerifier = publicForm.data?.settings?.responsePassword;
  if (!await verifyFormPassword(passwordVerifier, payload.formPassword)) {
    return json(403, { ok: false, code: "form_password_invalid" });
  }

  const fingerprint = await hmacFingerprint(serviceRole, payload.formId, remoteIp);
  const { data: permitted, error: rateLimitError } = await admin.rpc("claim_cokform_response_rate_limit", {
    p_form_id: payload.formId,
    p_fingerprint: fingerprint,
  });
  if (rateLimitError || permitted !== true) return json(429, { ok: false, code: "rate_limited" });

  const { data: submitOutcome, error: submitError } = await admin.rpc("submit_cokform_encrypted_response", {
    p_id: payload.id,
    p_form_id: payload.formId,
    p_submitted_at: new Date(submittedAt).toISOString(),
    p_answers: payload.answers,
    p_respondent_token: payload.respondentToken || null,
  });

  if (submitError) return json(503, { ok: false, code: "save_failed" });
  if (submitOutcome === "duplicate") return json(409, { ok: false, code: "duplicate" });
  if (submitOutcome === "response_limit_reached") return json(409, { ok: false, code: "response_limit_reached" });
  if (submitOutcome === "form_unavailable") return json(409, { ok: false, code: "form_unavailable" });
  if (submitOutcome !== "ok") return json(503, { ok: false, code: "save_failed" });
  return json(201, { ok: true });
});
