const DRAFT_PREFIX = "cokform:response-draft:v1:";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function getKey(formId) {
  return `${DRAFT_PREFIX}${formId}`;
}

function safeStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function loadResponseDraft(formId, questionIds = []) {
  if (!formId) return null;
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(getKey(formId));
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!isPlainObject(draft?.answers) || !Number.isFinite(Date.parse(draft.savedAt))) {
      storage.removeItem(getKey(formId));
      return null;
    }
    if (Date.now() - Date.parse(draft.savedAt) > MAX_AGE_MS) {
      storage.removeItem(getKey(formId));
      return null;
    }
    const allowed = new Set(questionIds);
    const answers = Object.fromEntries(Object.entries(draft.answers).filter(([questionId]) => questionId.startsWith("_cokform_") || allowed.has(questionId)));
    return { answers, savedAt: draft.savedAt };
  } catch {
    return null;
  }
}

export function saveResponseDraft(formId, answers) {
  if (!formId || !isPlainObject(answers)) return null;
  const storage = safeStorage();
  if (!storage) return null;
  try {
    const draft = { version: 1, savedAt: new Date().toISOString(), answers };
    storage.setItem(getKey(formId), JSON.stringify(draft));
    return draft.savedAt;
  } catch {
    return null;
  }
}

export function clearResponseDraft(formId) {
  if (!formId) return;
  try {
    safeStorage()?.removeItem(getKey(formId));
  } catch {
    // Browser storage can be blocked. This must not interrupt a submitted response.
  }
}

export function formatResponseDraftTime(value) {
  const parsed = Date.parse(value || "");
  if (!Number.isFinite(parsed)) return "방금";
  const seconds = Math.max(0, Math.round((Date.now() - parsed) / 1000));
  if (seconds < 60) return "방금";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}
