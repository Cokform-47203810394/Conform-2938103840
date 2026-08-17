import { getSupabaseClient, hasSupabaseConfig } from "./supabaseClient";
import { uid } from "../questionTypes";
import { decryptAnswers, encryptAnswers, isEncryptedEnvelope } from "./secureResponses";

const INDEX_KEY = "form-builder:index";
const DOC_PREFIX = "form-builder:doc";
const RESPONSE_PREFIX = "form-builder:responses";
const TABLE = "forms";
const PUBLIC_TABLE = "form_public";
const RESPONSE_TABLE = "responses";

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

export async function submitResponse(formId, answers, publicKey, settings = {}) {
  const encryptedAnswers = publicKey ? await encryptAnswers(publicKey, answers) : answers;
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
