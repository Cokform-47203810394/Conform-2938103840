import { getSupabaseClient, hasSupabaseConfig } from "./supabaseClient";
import { uid } from "../questionTypes";
import { decryptAnswers, encryptAnswers, isEncryptedEnvelope } from "./secureResponses";

const INDEX_KEY = "form-builder:index";
const DOC_PREFIX = "form-builder:doc";
const RESPONSE_PREFIX = "form-builder:responses";
const VERSION_PREFIX = "form-builder:versions";
const TABLE = "forms";
const PUBLIC_TABLE = "form_public";
const RESPONSE_TABLE = "responses";
const VERSION_TABLE = "form_versions";
const AUDIT_TABLE = "form_audit_events";
const AUDIT_PREFIX = "form-builder:audit";
const PARTICIPATION_PREFIX = "form-builder:participations";
const PARTICIPATION_TABLE = "form_participations";
const MAX_LOCAL_VERSIONS = 60;

function readIndexLocal() {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeIndexLocal(list) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("목록 저장 실패", e);
  }
}

function readResponsesLocal(id) {
  try {
    const raw = localStorage.getItem(`${RESPONSE_PREFIX}:${id}`);
    if (raw) return JSON.parse(raw);
    const legacy = localStorage.getItem(`${DOC_PREFIX}:${id}`);
    return legacy ? JSON.parse(legacy).responses || [] : [];
  } catch {
    return [];
  }
}

function writeResponsesLocal(id, responses) {
  localStorage.setItem(`${RESPONSE_PREFIX}:${id}`, JSON.stringify(responses));
}

function readParticipationsLocal() {
  try {
    const raw = localStorage.getItem(PARTICIPATION_PREFIX);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeParticipationsLocal(items) {
  try {
    localStorage.setItem(PARTICIPATION_PREFIX, JSON.stringify(items.slice(0, 100)));
  } catch {
    // Participation history is convenience metadata only; a quota failure must not block submission.
  }
}

function readVersionsLocal(id) {
  try {
    const raw = localStorage.getItem(`${VERSION_PREFIX}:${id}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeVersionsLocal(id, versions) {
  localStorage.setItem(`${VERSION_PREFIX}:${id}`, JSON.stringify(versions.slice(0, MAX_LOCAL_VERSIONS)));
}

function compactVersionForm(form) {
  const copy = JSON.parse(JSON.stringify(form || {}));
  // Data-URL images can be up to 2 MB each. Repeating them in up to 60 snapshots
  // would make storage unpredictable, so preserve only the structural form history.
  if (copy.descriptionImage?.src?.startsWith("data:")) {
    copy.descriptionImage = { ...copy.descriptionImage, src: "", versionImageOmitted: true };
  }
  return copy;
}

function versionSummary(form, reason = "autosave") {
  return {
    title: form?.title?.trim() || "제목 없는 설문지",
    questionCount: Array.isArray(form?.questions) ? form.questions.length : 0,
    reason,
  };
}

function publicFormData(form) {
  // Collaborator emails are editor metadata and must never be in the public row.
  const { collaborators: _private, ...safeForm } = form || {};
  return safeForm;
}

async function trySupabase(label, fn) {
  const supabase = getSupabaseClient();
  if (!supabase) return undefined;
  try {
    return await fn(supabase);
  } catch (e) {
    console.warn(`Supabase ${label} 실패`, e);
    return undefined;
  }
}

export const newFormId = uid;

export async function listForms() {
  const remote = await trySupabase("목록 조회", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return undefined;
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, title, updated_at, created_at, data")
      .order("updated_at", { ascending: false });
    if (error) return undefined;
    const ids = (data || []).map((row) => row.id);
    const [{ data: responseRows }, { data: viewRows }] = await Promise.all([
      ids.length ? supabase.from(RESPONSE_TABLE).select("form_id").in("form_id", ids) : Promise.resolve({ data: [] }),
      ids.length ? supabase.from("form_views").select("form_id").in("form_id", ids) : Promise.resolve({ data: [] }),
    ]);
    const responseCounts = (responseRows || []).reduce((acc, row) => ({ ...acc, [row.form_id]: (acc[row.form_id] || 0) + 1 }), {});
    const viewCounts = (viewRows || []).reduce((acc, row) => ({ ...acc, [row.form_id]: (acc[row.form_id] || 0) + 1 }), {});
    return (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
      questions: (row.data?.form?.questions || []).slice(0, 3),
      responseCount: responseCounts[row.id] || 0,
      viewCount: viewCounts[row.id] || 0,
      acceptingResponses: row.data?.form?.settings?.acceptingResponses !== false,
      ownerResponseNotification: row.data?.form?.settings?.ownerResponseNotification === true,
    }));
  });
  if (remote !== undefined) return remote;
  if (hasSupabaseConfig()) return [];
  return readIndexLocal().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

export async function recordFormView(formId) {
  const key = `form-builder:viewed:${formId}`;
  try {
    if (localStorage.getItem(key)) return false;
    localStorage.setItem(key, "1");
  } catch {
    return false;
  }
  const visitorId = (() => {
    try {
      const k = "form-builder:visitor-id";
      const existing = localStorage.getItem(k);
      if (existing) return existing;
      const next = uid();
      localStorage.setItem(k, next);
      return next;
    } catch {
      return uid();
    }
  })();
  const saved = await trySupabase("조회 기록", async (supabase) => {
    const { error } = await supabase.from("form_views").insert({ form_id: formId, visitor_id: visitorId });
    return error ? undefined : true;
  });
  return saved === true;
}

export async function getFormDoc(id) {
  const remote = await trySupabase("로드", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    const isOwnerSession = Boolean(authData?.user);
    const table = isOwnerSession ? TABLE : PUBLIC_TABLE;
    const { data, error } = await supabase.from(table).select("data").eq("id", id).maybeSingle();
    if (error) return undefined;
    if (!data) return null;

    const stored = data.data || {};
    if (!isOwnerSession) return { form: stored.form || stored, responses: [] };

    let responses = [];
    const result = await supabase
      .from(RESPONSE_TABLE)
      .select("id, submitted_at, answers")
      .eq("form_id", id)
      .order("submitted_at", { ascending: true });
    if (!result.error) {
      const decrypted = await Promise.all((result.data || []).map(async (row) => ({
        id: row.id,
        submittedAt: row.submitted_at,
        answers: isEncryptedEnvelope(row.answers)
          ? await decryptAnswers(id, row.answers).catch(() => null)
          : row.answers,
      })));
      responses = decrypted.filter((row) => row.answers !== null);
    }
    return { form: stored.form || stored, responses };
  });
  if (remote !== undefined) return remote;
  // Production must never open an old browser-local editor snapshot when
  // Supabase is configured. Public users use the RespondPage route instead.
  if (hasSupabaseConfig()) return null;

  try {
    const raw = localStorage.getItem(`${DOC_PREFIX}:${id}`);
    const stored = raw ? JSON.parse(raw) : null;
    if (!stored) return null;
    const localResponses = await Promise.all(readResponsesLocal(id).map(async (row) => ({
      ...row,
      answers: isEncryptedEnvelope(row.answers)
        ? await decryptAnswers(id, row.answers).catch(() => null)
        : row.answers,
    })));
    return { form: stored.form || stored, responses: localResponses.filter((row) => row.answers !== null) };
  } catch {
    return null;
  }
}

export async function saveFormDoc(id, doc) {
  const now = new Date().toISOString();
  const title = doc.form?.title?.trim() || "제목 없는 설문지";
  const payload = { form: doc.form };

  const savedRemotely = await trySupabase("저장", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return undefined;

    const { error: formError } = await supabase.from(TABLE).upsert({
      id,
      title,
      data: payload,
      owner: authData.user.id,
      updated_at: now,
    });
    if (formError) return undefined;

    const { error: publicError } = await supabase.from(PUBLIC_TABLE).upsert({
      id,
      title,
      data: publicFormData(doc.form),
      updated_at: now,
    });
    return publicError ? undefined : true;
  });
  if (savedRemotely) return true;
  if (getSupabaseClient()) return false;

  try {
    localStorage.setItem(`${DOC_PREFIX}:${id}`, JSON.stringify(payload));
    const index = readIndexLocal();
    const questionsPreview = (doc.form?.questions || []).slice(0, 3);
    const existing = index.find((f) => f.id === id);
    if (existing) {
      existing.title = title;
      existing.updatedAt = now;
      existing.questions = questionsPreview;
    } else {
      index.push({ id, title, createdAt: now, updatedAt: now, questions: questionsPreview });
    }
    writeIndexLocal(index);
    return true;
  } catch (e) {
    console.error("저장 실패", e);
    return false;
  }
}

export async function saveFormVersion(formId, form, reason = "autosave") {
  if (!form?.publicKey) return false;
  const snapshot = await encryptAnswers(form.publicKey, { form: compactVersionForm(form) }, { formId, purpose: "form-version" });
  const summary = versionSummary(form, reason);
  const now = new Date().toISOString();

  const savedRemotely = await trySupabase("버전 저장", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return undefined;
    const { error } = await supabase.from(VERSION_TABLE).insert({
      form_id: formId,
      snapshot,
      summary,
      created_at: now,
    });
    return error ? undefined : true;
  });
  if (savedRemotely) return true;
  if (getSupabaseClient()) return false;

  try {
    const versions = readVersionsLocal(formId);
    versions.unshift({ id: uid(), createdAt: now, snapshot, summary });
    writeVersionsLocal(formId, versions);
    return true;
  } catch (error) {
    console.warn("폼 버전 저장 실패", error);
    return false;
  }
}

export async function getFormVersions(formId) {
  const remote = await trySupabase("버전 조회", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return undefined;
    const { data, error } = await supabase
      .from(VERSION_TABLE)
      .select("id, created_at, snapshot, summary")
      .eq("form_id", formId)
      .order("created_at", { ascending: false })
      .limit(MAX_LOCAL_VERSIONS);
    if (error) return undefined;
    const versions = await Promise.all((data || []).map(async (row) => {
      const decoded = isEncryptedEnvelope(row.snapshot)
        ? await decryptAnswers(formId, row.snapshot, { purpose: "form-version" }).catch(() => null)
        : null;
      if (!decoded?.form) return null;
      return {
        id: row.id,
        createdAt: row.created_at,
        form: decoded.form,
        summary: row.summary || versionSummary(decoded.form),
      };
    }));
    return versions.filter(Boolean);
  });
  if (remote !== undefined) return remote;
  if (hasSupabaseConfig()) return [];

  const versions = await Promise.all(readVersionsLocal(formId).map(async (row) => {
    const decoded = isEncryptedEnvelope(row.snapshot)
      ? await decryptAnswers(formId, row.snapshot, { purpose: "form-version" }).catch(() => null)
      : null;
    if (!decoded?.form) return null;
    return {
      id: row.id,
      createdAt: row.createdAt,
      form: decoded.form,
      summary: row.summary || versionSummary(decoded.form),
    };
  }));
  return versions.filter(Boolean);
}

function assertRecoveryCiphertext(payload) {
  const hasPlainResponse = (payload?.responses || []).some((row) => !isEncryptedEnvelope(row?.answers));
  const hasPlainVersion = (payload?.versions || []).some((row) => !isEncryptedEnvelope(row?.snapshot));
  if (hasPlainResponse || hasPlainVersion) {
    throw new Error("암호화되지 않은 이전 응답 또는 버전이 있어 안전한 복구 번들을 만들 수 없습니다. 해당 데이터를 먼저 검토·삭제해 주세요.");
  }
}

export async function exportFormRecoveryData(formId) {
  const remote = await trySupabase("복구 데이터 내보내기", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return undefined;
    const [formResult, responseResult, versionResult] = await Promise.all([
      supabase.from(TABLE).select("id, title, data, created_at, updated_at").eq("id", formId).maybeSingle(),
      supabase.from(RESPONSE_TABLE).select("id, form_id, submitted_at, answers, respondent_token").eq("form_id", formId).order("submitted_at", { ascending: true }),
      supabase.from(VERSION_TABLE).select("created_at, snapshot, summary").eq("form_id", formId).order("created_at", { ascending: true }),
    ]);
    if (formResult.error || !formResult.data || responseResult.error || versionResult.error) return undefined;
    return {
      format: "cokform-form-data",
      version: 1,
      formId,
      exportedAt: new Date().toISOString(),
      form: formResult.data,
      responses: responseResult.data || [],
      versions: versionResult.data || [],
    };
  });
  if (remote !== undefined) {
    assertRecoveryCiphertext(remote);
    return remote;
  }
  if (hasSupabaseConfig()) throw new Error("서버 복구 데이터를 가져오지 못했습니다.");

  const raw = localStorage.getItem(`${DOC_PREFIX}:${formId}`);
  const stored = raw ? JSON.parse(raw) : null;
  if (!stored?.form) throw new Error("복구할 폼 데이터를 찾지 못했습니다.");
  const payload = {
    format: "cokform-form-data",
    version: 1,
    formId,
    exportedAt: new Date().toISOString(),
    form: { id: formId, title: stored.form.title || "제목 없는 설문지", data: stored },
    responses: readResponsesLocal(formId).map((row) => ({
      id: row.id,
      form_id: formId,
      submitted_at: row.submittedAt,
      answers: row.answers,
      respondent_token: row.respondentToken || null,
    })),
    versions: readVersionsLocal(formId).map((row) => ({ created_at: row.createdAt, snapshot: row.snapshot, summary: row.summary })),
  };
  assertRecoveryCiphertext(payload);
  return payload;
}

/**
 * Restores only ciphertext and public form configuration. The browser never
 * decrypts response answers while importing, and ownership is reassigned to
 * the currently authenticated Cokform account by the normal RLS rules.
 */
export async function restoreFormRecoveryData(payload) {
  if (payload?.format !== "cokform-form-data" || payload?.version !== 1 || !payload?.formId || !payload?.form?.data?.form) {
    throw new Error("Cokform 복구 데이터 형식이 아닙니다.");
  }
  assertRecoveryCiphertext(payload);
  const formId = payload.formId;
  const form = payload.form.data.form;
  const title = form.title?.trim() || "제목 없는 설문지";
  const remote = await trySupabase("복구 데이터 가져오기", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return undefined;
    const { error: formError } = await supabase.from(TABLE).upsert({
      id: formId,
      title,
      data: { form },
      owner: authData.user.id,
      updated_at: new Date().toISOString(),
    });
    if (formError) return undefined;
    const { error: publicError } = await supabase.from(PUBLIC_TABLE).upsert({
      id: formId,
      title,
      data: publicFormData(form),
      updated_at: new Date().toISOString(),
    });
    if (publicError) return undefined;

    const responses = (payload.responses || []).map((row) => ({
      id: row.id,
      form_id: formId,
      submitted_at: row.submitted_at,
      answers: row.answers,
      respondent_token: row.respondent_token || null,
    }));
    if (responses.length) {
      const { error } = await supabase.from(RESPONSE_TABLE).insert(responses);
      if (error) return undefined;
    }
    const versions = (payload.versions || []).map((row) => ({
      form_id: formId,
      created_at: row.created_at,
      snapshot: row.snapshot,
      summary: row.summary || {},
    }));
    if (versions.length) {
      const { error } = await supabase.from(VERSION_TABLE).insert(versions);
      if (error) return undefined;
    }
    return { ok: true, responseCount: responses.length, versionCount: versions.length };
  });
  if (remote !== undefined) return remote;
  if (hasSupabaseConfig()) throw new Error("서버 복구 데이터를 저장하지 못했습니다.");

  localStorage.setItem(`${DOC_PREFIX}:${formId}`, JSON.stringify({ form }));
  writeResponsesLocal(formId, (payload.responses || []).map((row) => ({ id: row.id, submittedAt: row.submitted_at, answers: row.answers })));
  writeVersionsLocal(formId, (payload.versions || []).map((row) => ({ id: uid(), createdAt: row.created_at, snapshot: row.snapshot, summary: row.summary || {} })));
  const index = readIndexLocal();
  const existing = index.find((item) => item.id === formId);
  const summary = { id: formId, title, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(), questions: (form.questions || []).slice(0, 3) };
  if (existing) Object.assign(existing, summary);
  else index.push(summary);
  writeIndexLocal(index);
  return { ok: true, responseCount: (payload.responses || []).length, versionCount: (payload.versions || []).length };
}

export async function listParticipatedForms() {
  const local = readParticipationsLocal();
  const remote = await trySupabase("참여 이력 조회", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return [];
    const { data, error } = await supabase
      .from(PARTICIPATION_TABLE)
      .select("form_id, form_title, question_count, first_participated_at, last_participated_at")
      .order("last_participated_at", { ascending: false })
      .limit(100);
    if (error) return undefined;
    return (data || []).map((row) => ({
      id: row.form_id,
      title: row.form_title,
      questionCount: row.question_count,
      firstParticipatedAt: row.first_participated_at,
      lastParticipatedAt: row.last_participated_at,
      source: "account",
    }));
  });

  const combined = new Map();
  [...local, ...(remote || [])].forEach((item) => {
    const previous = combined.get(item.id);
    const itemDate = new Date(item.lastParticipatedAt || 0).getTime();
    const previousDate = new Date(previous?.lastParticipatedAt || 0).getTime();
    if (!previous || itemDate >= previousDate) combined.set(item.id, item);
  });
  return [...combined.values()].sort((a, b) => new Date(b.lastParticipatedAt) - new Date(a.lastParticipatedAt));
}

export async function recordFormParticipation(formId, form) {
  const now = new Date().toISOString();
  const summary = {
    id: formId,
    title: form?.title?.trim() || "제목 없는 설문지",
    questionCount: Array.isArray(form?.questions) ? form.questions.filter((q) => !["privacy_notice"].includes(q.type)).length : 0,
    lastParticipatedAt: now,
    source: "device",
  };
  const current = readParticipationsLocal();
  const previous = current.find((item) => item.id === formId);
  const next = [{ ...previous, ...summary, firstParticipatedAt: previous?.firstParticipatedAt || now }]
    .concat(current.filter((item) => item.id !== formId));
  writeParticipationsLocal(next);

  await trySupabase("참여 이력 저장", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return undefined;
    const { error } = await supabase.from(PARTICIPATION_TABLE).upsert({
      form_id: formId,
      participant_id: authData.user.id,
      form_title: summary.title,
      question_count: summary.questionCount,
      last_participated_at: now,
    }, { onConflict: "participant_id,form_id" });
    return error ? undefined : true;
  });
  return summary;
}

export async function submitResponse(formId, answers, publicKey, settings = {}) {
  const encryptedAnswers = publicKey ? await encryptAnswers(publicKey, answers, { formId, purpose: "response" }) : answers;
  const response = { id: uid(), submittedAt: new Date().toISOString(), answers };
  const respondentToken = settings.limitOneResponse ? (() => {
    try {
      const key = `form-builder:respondent-token:${formId}`;
      const existing = localStorage.getItem(key);
      if (existing) return existing;
      const next = uid();
      localStorage.setItem(key, next);
      return next;
    } catch { return uid(); }
  })() : null;
  let duplicate = false;
  const savedRemotely = await trySupabase("응답 제출", async (supabase) => {
    if (!publicKey) return undefined;
    const { error } = await supabase.from(RESPONSE_TABLE).insert({
      id: response.id,
      form_id: formId,
      submitted_at: response.submittedAt,
      answers: encryptedAnswers,
      respondent_token: respondentToken,
    });
    if (error?.code === "23505") duplicate = true;
    return error ? undefined : true;
  });
  if (duplicate) return { ok: false, reason: "duplicate", response: null };
  if (savedRemotely) return { ok: true, response };
  if (getSupabaseClient()) return { ok: false, response: null };

  try {
    const localResponse = { ...response, answers: encryptedAnswers };
    const responses = [...readResponsesLocal(formId), localResponse];
    writeResponsesLocal(formId, responses);
    return { ok: true, response };
  } catch (e) {
    console.error("응답 제출 실패", e);
    return { ok: false, response: null };
  }
}

export async function recordFormAuditEvent(formId, eventType, metadata = {}) {
  const safeMetadata = Object.fromEntries(
    Object.entries(metadata || {}).flatMap(([key, value]) => {
      if (typeof value === "string") return [[key, value.slice(0, 120)]];
      if (typeof value === "number" || typeof value === "boolean") return [[key, value]];
      return [];
    })
  );
  const savedRemotely = await trySupabase("감사 기록", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return undefined;
    const { error } = await supabase.from(AUDIT_TABLE).insert({
      form_id: formId,
      event_type: eventType,
      metadata: safeMetadata,
    });
    return error ? undefined : true;
  });
  if (savedRemotely) return true;
  if (getSupabaseClient()) return false;

  try {
    const key = `${AUDIT_PREFIX}:${formId}`;
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.unshift({ id: uid(), eventType, metadata: safeMetadata, createdAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(current.slice(0, 100)));
    return true;
  } catch {
    return false;
  }
}

export async function clearResponses(formId) {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return false;
      const { error } = await supabase.from(RESPONSE_TABLE).delete().eq("form_id", formId);
      return !error;
    } catch {
      return false;
    }
  }

  try {
    writeResponsesLocal(formId, []);
    return true;
  } catch {
    return false;
  }
}

export async function deleteFormDoc(id) {
  const deletedRemotely = await trySupabase("삭제", async (supabase) => {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return undefined;
    const { data: deletedRows, error } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", id)
      .select("id");
    if (error || !deletedRows?.length) return undefined;
    // form_public and responses reference forms with ON DELETE CASCADE.
    // Keep this explicit cleanup as a best-effort fallback for older pilot schemas.
    await supabase.from(PUBLIC_TABLE).delete().eq("id", id);
    return true;
  });

  if (!deletedRemotely) {
    if (hasSupabaseConfig()) return false;
    localStorage.removeItem(`${DOC_PREFIX}:${id}`);
    localStorage.removeItem(`${RESPONSE_PREFIX}:${id}`);
    localStorage.removeItem(`${VERSION_PREFIX}:${id}`);
    writeIndexLocal(readIndexLocal().filter((f) => f.id !== id));
  }
  return true;
}

export async function duplicateFormDoc(id) {
  const doc = await getFormDoc(id);
  if (!doc) return null;
  const newId = newFormId();
  await saveFormDoc(newId, { form: { ...doc.form, title: `${doc.form.title} 사본` } });
  return newId;
}
