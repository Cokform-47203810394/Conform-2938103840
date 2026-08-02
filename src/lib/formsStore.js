import { getSupabaseClient } from "./supabaseClient";
import { uid } from "../questionTypes";

const INDEX_KEY = "form-builder:index";
const DOC_PREFIX = "form-builder:doc";
const TABLE = "forms";

// See README.md for the SQL to create this table in Supabase:
//   id text primary key, title text, data jsonb, updated_at timestamptz, created_at timestamptz

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

// Runs `fn` against Supabase if configured. Returns undefined (never throws) on any
// failure or when unconfigured, so every call site can just fall through to localStorage.
async function trySupabase(label, fn) {
  const supabase = getSupabaseClient();
  if (!supabase) return undefined;
  try {
    return await fn(supabase);
  } catch (e) {
    console.warn(`Supabase ${label} 실패, 로컬 저장소로 대체합니다.`, e);
    return undefined;
  }
}

export const newFormId = uid;

// { id, title, updatedAt, createdAt, questions } 목록 — 최근 수정순
// questions는 카드 썸네일 렌더링용으로 앞 3개만 담아온다 (응답 데이터까지 통째로 fetch하지 않기 위함)
export async function listForms() {
  const remote = await trySupabase("목록 조회", async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, title, updated_at, created_at, data->questions")
      .order("updated_at", { ascending: false });
    if (error || !data) return undefined;
    return data.map((r) => ({
      id: r.id,
      title: r.title,
      updatedAt: r.updated_at,
      createdAt: r.created_at,
      questions: (r.questions || []).slice(0, 3),
    }));
  });
  if (remote) return remote;

  return readIndexLocal().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

// { form, responses } 전체 문서
export async function getFormDoc(id) {
  const remote = await trySupabase("로드", async (supabase) => {
    const { data, error } = await supabase.from(TABLE).select("data").eq("id", id).maybeSingle();
    if (error || !data) return undefined;
    return data.data;
  });
  if (remote) return remote;

  try {
    const raw = localStorage.getItem(`${DOC_PREFIX}:${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveFormDoc(id, doc) {
  const now = new Date().toISOString();
  const title = doc.form?.title?.trim() || "제목 없는 설문지";

  const savedRemotely = await trySupabase("저장", async (supabase) => {
    const { error } = await supabase.from(TABLE).upsert({ id, title, data: doc, updated_at: now });
    return error ? undefined : true;
  });
  if (savedRemotely) return true;

  try {
    localStorage.setItem(`${DOC_PREFIX}:${id}`, JSON.stringify(doc));
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

export async function deleteFormDoc(id) {
  const deletedRemotely = await trySupabase("삭제", async (supabase) => {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    return error ? undefined : true;
  });

  if (!deletedRemotely) {
    localStorage.removeItem(`${DOC_PREFIX}:${id}`);
    writeIndexLocal(readIndexLocal().filter((f) => f.id !== id));
  }
  return true;
}

export async function duplicateFormDoc(id) {
  const doc = await getFormDoc(id);
  if (!doc) return null;
  const newId = newFormId();
  await saveFormDoc(newId, {
    form: { ...doc.form, title: `${doc.form.title} 사본` },
    responses: [],
  });
  return newId;
}
