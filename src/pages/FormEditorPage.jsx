import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  ArrowLeft,
  Star,
  Palette,
  Eye,
  Undo2,
  Redo2,
  Link as LinkIcon,
  UserPlus,
  X,
  Copy,
} from "lucide-react";
import QuestionEditor from "../components/QuestionEditor";
import RichTextInput from "../components/RichTextInput";
import PreviewForm from "../components/PreviewForm";
import ResponsesView from "../components/ResponsesView";
import { IconButton, Toggle } from "../components/Primitives";
import { Popover, Modal } from "../components/Overlay";
import { clearResponses as clearStoredResponses, getFormDoc, saveFormDoc, submitResponse } from "../lib/formsStore";
import { emptyForm, defaultQuestion, uid } from "../questionTypes";
import { ensureFormKeyPair } from "../lib/secureResponses";
import { ELEV1, ELEV3, MD, NAVER_GREEN, CHART_PALETTE } from "../theme";
import AuthControl from "../components/AuthControl";
import QuickAddToolbar from "../components/QuickAddToolbar";

const PALETTE_SWATCHES = [MD.primary, ...CHART_PALETTE.filter((c) => c !== MD.primary), NAVER_GREEN];
const BACKGROUND_SWATCHES = ["#F5F3EC", "#FFFDF8", "#FFF2E8", "#EAF6EF", "#EAF1FB", "#FCEFEF"];

function normalizeForm(value) {
  const fallback = emptyForm();
  const next = value || {};
  return {
    ...fallback,
    ...next,
    settings: { ...fallback.settings, ...(next.settings || {}) },
    questions: Array.isArray(next.questions) ? next.questions : fallback.questions,
    collaborators: Array.isArray(next.collaborators) ? next.collaborators : [],
  };
}

export default function FormEditorPage({ formId, user, onBack }) {
  const [form, setForm] = useState(emptyForm());
  const [responses, setResponses] = useState([]);
  const [tab, setTab] = useState("edit");
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("saved");
  const saveTimer = useRef(null);
  const loadedRef = useRef(false);
  const formRef = useRef(form);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  // ---- undo / redo (coalesces rapid edits into one checkpoint every 600ms) ----
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const applyingHistory = useRef(false);
  const pendingSnapshot = useRef(null);
  const historyTimer = useRef(null);

  const updateForm = useCallback((updater) => {
    setForm((prev) => {
      if (!applyingHistory.current && loadedRef.current) {
        if (pendingSnapshot.current === null) pendingSnapshot.current = normalizeForm(form);
        if (historyTimer.current) clearTimeout(historyTimer.current);
        historyTimer.current = setTimeout(() => {
          setPast((p) => [...p.slice(-49), pendingSnapshot.current]);
          setFuture([]);
          pendingSnapshot.current = null;
        }, 600);
      }
      return typeof updater === "function" ? updater(prev) : updater;
    });
  }, [form]);

  const undo = () => {
    if (pendingSnapshot.current !== null) {
      if (historyTimer.current) clearTimeout(historyTimer.current);
      const previous = pendingSnapshot.current;
      pendingSnapshot.current = null;
      setFuture((f) => [form, ...f]);
      setPast((p) => [...p.slice(-49), previous]);
      applyingHistory.current = true;
      setForm(normalizeForm(previous));
      applyingHistory.current = false;
      return;
    }
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [form, ...f]);
    applyingHistory.current = true;
    setForm(normalizeForm(previous));
    applyingHistory.current = false;
  };
  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, form]);
    applyingHistory.current = true;
    setForm(normalizeForm(next));
    applyingHistory.current = false;
  };

  // ---- load / save ----
  useEffect(() => {
    setLoaded(false);
    loadedRef.current = false;
    setPast([]);
    setFuture([]);
    pendingSnapshot.current = null;
    if (historyTimer.current) clearTimeout(historyTimer.current);
    historyTimer.current = null;
    (async () => {
      const doc = await getFormDoc(formId);
      let nextForm = normalizeForm(doc?.form);
      const keyPair = await ensureFormKeyPair(formId);
      if (!nextForm.publicKey) nextForm = { ...nextForm, publicKey: keyPair.publicJwk };
      formRef.current = nextForm;
      setForm(nextForm);
      setResponses(doc?.responses || []);
      loadedRef.current = true;
      setLoaded(true);
    })();
  }, [formId]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        const didSave = await saveFormDoc(formId, { form });
        if (!didSave) throw new Error("save_failed");
        setSaveState("saved");
      } catch {
        setSaveState("error");
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [form, loaded, formId]);

  // ---- question CRUD ----
  const updateQuestion = (id, next) => {
    updateForm((f) => ({ ...f, questions: f.questions.map((q) => (q.id === id ? next : q)) }));
  };
  const deleteQuestion = (id) => {
    if (typeof window !== "undefined" && !window.confirm("이 질문을 삭제할까요? 실행 취소로 복원할 수 있어요.")) return;
    updateForm((f) => ({ ...f, questions: f.questions.filter((q) => q.id !== id) }));
  };
  const duplicateQuestion = (id) => {
    updateForm((f) => {
      const idx = f.questions.findIndex((q) => q.id === id);
      const copy = { ...f.questions[idx], id: uid() };
      const questions = [...f.questions];
      questions.splice(idx + 1, 0, copy);
      return { ...f, questions };
    });
  };
  const moveQuestion = (id, dir) => {
    updateForm((f) => {
      const idx = f.questions.findIndex((q) => q.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= f.questions.length) return f;
      const questions = [...f.questions];
      [questions[idx], questions[newIdx]] = [questions[newIdx], questions[idx]];
      return { ...f, questions };
    });
  };
  const addQuestion = (type = "short") => {
    updateForm((f) => ({ ...f, questions: [...f.questions, defaultQuestion(type)] }));
  };

  // ---- drag reorder (native HTML5 DnD, no extra dependency) ----
  const [dragIndex, setDragIndex] = useState(null);
  const handleDrop = (index) => (e) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    updateForm((f) => {
      const questions = [...f.questions];
      const [moved] = questions.splice(dragIndex, 1);
      questions.splice(index, 0, moved);
      return { ...f, questions };
    });
    setDragIndex(null);
  };

  const handleFormSubmit = useCallback(async (answers) => {
    const result = await submitResponse(formId, answers, form.publicKey);
    if (!result.ok) {
      window.alert("응답 저장에 실패했어요. 네트워크를 확인한 뒤 다시 시도해주세요.");
      return;
    }
    setResponses((r) => [...r, result.response]);
  }, [formId, form.publicKey]);
  const clearResponses = async () => {
    if (typeof window !== "undefined" && !window.confirm("모든 응답을 삭제할까요? 이 작업은 되돌릴 수 없어요.")) return;
    const cleared = await clearStoredResponses(formId);
    if (!cleared) {
      window.alert("응답을 삭제할 권한이 없거나 저장소에 연결되지 않았어요.");
      return;
    }
    setResponses([]);
  };

  // ---- share / theme / collaborators ----
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [collabInput, setCollabInput] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const accent = form.accentColor || MD.primary;
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?respond=${formId}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast("링크가 복사되었습니다");
    } catch {
      setToast("복사에 실패했어요. 링크를 직접 선택해 복사해주세요.");
    }
  };

  const handleDescriptionImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setToast("이미지 파일만 넣을 수 있어요.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setToast("이미지는 2MB 이하로 넣어주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateForm((f) => ({ ...f, descriptionImage: { src: reader.result, alt: file.name.replace(/\\.[^.]+$/, "") } }));
    reader.readAsDataURL(file);
  };

  const addCollaborator = () => {
    const email = collabInput.trim();
    if (!email) return;
    updateForm((f) => ({ ...f, collaborators: [...new Set([...(f.collaborators || []), email])] }));
    setCollabInput("");
  };
  const removeCollaborator = (email) => {
    updateForm((f) => ({ ...f, collaborators: (f.collaborators || []).filter((e) => e !== email) }));
  };

  const canViewResponses = Boolean(user?.id);
  const tabs = [
    { id: "edit", label: "흐름" },
    ...(canViewResponses ? [{ id: "responses", label: "답변", badge: responses.length }] : []),
    { id: "settings", label: "운영" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: form.backgroundColor || "#F5F3EC" }}>
      <style>{`
        .safe-bottom { padding-bottom: max(6rem, calc(env(safe-area-inset-bottom) + 5rem)); }
        input, select, textarea, button { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* top app bar */}
      <div className={`relative sticky top-0 z-10 border-b border-[#DDE1D9] bg-[#FFFDF8]/95 backdrop-blur ${ELEV1}`}>
        <div className="mx-auto flex max-w-4xl items-center gap-1 px-3 py-3 sm:px-4">
          <IconButton title="홈으로" onClick={onBack}>
            <ArrowLeft size={18} />
          </IconButton>
          <img
            src={`${import.meta.env.BASE_URL}brand/cokform-mark.svg`}
            alt="콕폼"
            className="hidden h-7 w-7 rounded-[9px] sm:block"
          />
          <input
            value={form.title}
            onChange={(e) => updateForm((f) => ({ ...f, title: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-base font-semibold tracking-[-0.03em] text-[#17251F] outline-none sm:text-lg"
          />
          <span aria-live="polite" className={`hidden shrink-0 text-[11px] sm:inline ${saveState === "error" ? "text-[#B3261E]" : "text-[#78837C]"}`}>
            {saveState === "saving" ? "저장 중…" : saveState === "error" ? "저장 실패" : "저장됨"}
          </span>
          <IconButton title={form.starred ? "즐겨찾기 해제" : "즐겨찾기"} onClick={() => updateForm((f) => ({ ...f, starred: !f.starred }))}>
            <Star size={18} fill={form.starred ? accent : "none"} color={form.starred ? accent : "currentColor"} />
          </IconButton>

          <div className="ml-auto hidden shrink-0 items-center gap-0.5 overflow-x-auto sm:flex">
            <div className="relative">
              <IconButton title="테마 색상" onClick={() => setPaletteOpen((v) => !v)}>
                <Palette size={18} />
              </IconButton>
              {paletteOpen && (
                <Popover onClose={() => setPaletteOpen(false)} width="w-52">
                  <div className="mb-2 text-xs font-medium text-[#78837C]">테마 색상</div>
                  <div className="mb-4 grid grid-cols-6 gap-2">
                    {PALETTE_SWATCHES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          updateForm((f) => ({ ...f, accentColor: c }));
                          setPaletteOpen(false);
                        }}
                        className="h-7 w-7 rounded-full ring-2 ring-offset-2"
                        style={{ backgroundColor: c, ringColor: accent === c ? c : "transparent" }}
                      />
                    ))}
                  </div>
                  <div className="mb-2 text-xs font-medium text-[#78837C]">배경색</div>
                  <div className="grid grid-cols-6 gap-2">
                    {BACKGROUND_SWATCHES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          updateForm((f) => ({ ...f, backgroundColor: c }));
                          setPaletteOpen(false);
                        }}
                        className="h-7 w-7 rounded-full border border-[#E0E0E0] ring-2 ring-offset-2"
                        style={{ backgroundColor: c, ringColor: (form.backgroundColor || "#F5F3EC") === c ? MD.primary : "transparent" }}
                      />
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#F0EEE6] pt-3">
                    <label className="flex items-center justify-between gap-2 text-xs text-[#59645E]">
                      강조색
                      <input type="color" value={accent} onChange={(e) => updateForm((f) => ({ ...f, accentColor: e.target.value }))} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" />
                    </label>
                    <label className="flex items-center justify-between gap-2 text-xs text-[#59645E]">
                      배경색
                      <input type="color" value={form.backgroundColor || "#F5F3EC"} onChange={(e) => updateForm((f) => ({ ...f, backgroundColor: e.target.value }))} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" />
                    </label>
                  </div>
                </Popover>
              )}
            </div>
            <IconButton title="미리보기 (새 탭)" onClick={() => window.open(shareUrl, "_blank")}>
              <Eye size={18} />
            </IconButton>
            <IconButton title="실행 취소" onClick={undo} disabled={past.length === 0}>
              <Undo2 size={18} />
            </IconButton>
            <IconButton title="다시 실행" onClick={redo} disabled={future.length === 0}>
              <Redo2 size={18} />
            </IconButton>
            <IconButton title="링크 복사" onClick={copyLink}>
              <LinkIcon size={18} />
            </IconButton>
            <IconButton title="공동작업자" onClick={() => setCollabOpen(true)}>
              <UserPlus size={18} />
            </IconButton>
            <AuthControl user={user} showLogout={false} />
            <button
              onClick={() => setShareOpen(true)}
              className="ml-1 shrink-0 rounded-full bg-[#17866D] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(23,37,31,0.12)] transition hover:bg-[#0F705B]"
              style={{ backgroundColor: accent }}
            >
              공유 시작
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-1 border-t border-[#F0EEE6] px-3 py-1.5 sm:hidden">
          <IconButton title="테마 색상" onClick={() => setPaletteOpen((v) => !v)}><Palette size={17} /></IconButton>
          <IconButton title="미리보기" onClick={() => window.open(shareUrl, "_blank")}><Eye size={17} /></IconButton>
          <IconButton title="실행 취소" onClick={undo} disabled={past.length === 0}><Undo2 size={17} /></IconButton>
          <IconButton title="다시 실행" onClick={redo} disabled={future.length === 0}><Redo2 size={17} /></IconButton>
          <IconButton title="링크 복사" onClick={copyLink}><LinkIcon size={17} /></IconButton>
          <button type="button" onClick={() => setShareOpen(true)} className="ml-1 flex-1 rounded-full px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>공유</button>
        </div>
        {paletteOpen && (
          <div className="absolute right-3 top-[6.5rem] z-30 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-[#DDE1D9] bg-[#FFFDF8] p-3 shadow-[0_8px_24px_rgba(23,37,31,0.14)] sm:hidden">
            <div className="mb-2 text-xs font-semibold text-[#59645E]">테마 색상</div>
            <div className="mb-3 grid grid-cols-8 gap-2">
              {PALETTE_SWATCHES.map((c) => <button key={c} type="button" aria-label={`강조색 ${c}`} onClick={() => { updateForm((f) => ({ ...f, accentColor: c })); setPaletteOpen(false); }} className="h-7 w-7 rounded-full border border-white ring-1 ring-[#DDE1D9]" style={{ backgroundColor: c }} />)}
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-[#F0EEE6] pt-3">
              <label className="flex items-center justify-between gap-2 text-xs text-[#59645E]">강조색<input type="color" value={accent} onChange={(e) => updateForm((f) => ({ ...f, accentColor: e.target.value }))} className="h-8 w-10" /></label>
              <label className="flex items-center justify-between gap-2 text-xs text-[#59645E]">배경색<input type="color" value={form.backgroundColor || "#F5F3EC"} onChange={(e) => updateForm((f) => ({ ...f, backgroundColor: e.target.value }))} className="h-8 w-10" /></label>
            </div>
          </div>
        )}
        <div className="mx-auto flex max-w-4xl justify-center gap-4 border-t border-[#DDE1D9] px-3 sm:gap-8 sm:px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex min-w-0 flex-1 items-center justify-center gap-1 border-b-2 px-1 py-2.5 text-xs font-medium transition-colors sm:flex-none sm:gap-1.5 sm:text-sm ${
                tab === t.id ? "text-[#0B4D3D]" : "border-transparent text-[#78837C] hover:text-[#17251F]"
              }`}
              style={{ borderColor: tab === t.id ? accent : "transparent" }}
            >
              {t.label}
              {t.badge > 0 && (
                <span className="rounded-full bg-[#D8ED59] px-1.5 font-mono text-[11px] font-semibold text-[#17251F]">{t.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="safe-bottom relative mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
        {!loaded ? (
          <div className="py-16 text-center text-sm text-[#78837C]">불러오는 중…</div>
        ) : (
          <>
            {tab === "edit" && (
              <div className="space-y-3 sm:space-y-4">
                <QuickAddToolbar onAdd={addQuestion} />
                <div className="rounded-xl border-t-8 bg-white p-4 sm:p-5" style={{ borderTopColor: accent, boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)" }}>
                  <RichTextInput
                    value={form.description}
                    onChange={(html) => updateForm((f) => ({ ...f, description: html }))}
                    placeholder="이 폼으로 무엇을 알고 싶은지 적어보세요"
                    className="min-h-[2.5rem] w-full text-base text-[#59645E] sm:text-sm"
                  />
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#F0EEE6] pt-3">
                    <label className="cursor-pointer rounded-full border border-[#C9CEC6] bg-[#FFFDF8] px-3 py-1.5 text-xs font-semibold text-[#59645E] hover:border-[#17866D] hover:bg-[#F1FAF4]">
                      설명 이미지 넣기
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => handleDescriptionImageUpload(e.target.files?.[0])} />
                    </label>
                    <input
                      value={form.descriptionImage?.src?.startsWith("data:") ? "" : form.descriptionImage?.src || ""}
                      onChange={(e) => updateForm((f) => ({ ...f, descriptionImage: e.target.value ? { ...(f.descriptionImage || {}), src: e.target.value } : null }))}
                      placeholder="이미지 URL 붙여넣기"
                      className="min-w-[13rem] flex-1 rounded-full border border-[#C9CEC6] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#17251F] outline-none focus:border-[#17866D]"
                    />
                    {form.descriptionImage?.src && (
                      <>
                        <input
                          value={form.descriptionImage.alt || ""}
                          onChange={(e) => updateForm((f) => ({ ...f, descriptionImage: { ...f.descriptionImage, alt: e.target.value } }))}
                          placeholder="대체텍스트"
                          className="min-w-[9rem] rounded-full border border-[#C9CEC6] bg-[#FFFDF8] px-3 py-1.5 text-xs text-[#17251F] outline-none focus:border-[#17866D]"
                        />
                        <button type="button" onClick={() => updateForm((f) => ({ ...f, descriptionImage: null }))} className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#B3261E] hover:bg-[#FBE4E0]">
                          이미지 삭제
                        </button>
                      </>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[#78837C]">업로드 이미지는 최대 2MB이며 폼 데이터에 함께 저장돼요. 민감한 원본 이미지는 넣지 마세요.</p>
                </div>

                {form.questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    q={q}
                    index={i}
                    onChange={(next) => updateQuestion(q.id, next)}
                    onDelete={() => deleteQuestion(q.id)}
                    onDuplicate={() => duplicateQuestion(q.id)}
                    onMove={(dir) => moveQuestion(q.id, dir)}
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop(i)}
                    onDragEnd={() => setDragIndex(null)}
                    isDragging={dragIndex === i}
                  />
                ))}

                <button
                  type="button"
                  onClick={() => addQuestion("short")}
                  className={`fixed bottom-6 right-4 z-20 flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-medium text-white transition-shadow active:scale-95 sm:right-8 lg:hidden ${ELEV3}`}
                  style={{ backgroundColor: accent }}
                >
                  <Plus size={20} /> 질문 추가
                </button>
              </div>
            )}

            {tab === "responses" && canViewResponses && (
              <div>
                <div className="mb-3 text-xs font-medium text-[#59645E]">작성자 전용 · 이 폼의 소유자만 응답을 복호화하고 내보낼 수 있어요.</div>
                <ResponsesView form={form} responses={responses} onClear={clearResponses} />
              </div>
            )}

            {tab === "settings" && (
              <div className="space-y-4">
                <div className={`rounded-xl bg-white p-5 ${ELEV1}`}>
                  <h3 className="mb-4 text-sm font-medium text-[#17251F]">응답</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-[#17251F]">이메일 주소 수집</div>
                        <div className="text-xs text-[#78837C]">응답 목록에 이메일 열을 표시해요</div>
                      </div>
                      <Toggle
                        checked={form.settings?.collectEmail}
                        onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, collectEmail: v } }))}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-[#17251F]">응답 1회로 제한</div>
                        <div className="text-xs text-[#78837C]">같은 브라우저에서 중복 제출을 막아요</div>
                      </div>
                      <Toggle
                        checked={form.settings?.limitOneResponse}
                        onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, limitOneResponse: v } }))}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-[#17251F]">응답 받는 중</div>
                        <div className="text-xs text-[#78837C]">꺼두면 공유 링크로 들어와도 제출할 수 없어요</div>
                      </div>
                      <Toggle
                        checked={form.settings?.acceptingResponses}
                        onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, acceptingResponses: v } }))}
                      />
                    </div>
                    <div className="border-t border-[#F0EEE6] pt-4">
                      <label className="flex items-center justify-between gap-4">
                        <span>
                          <span className="block text-sm text-[#17251F]">응답 보관기간</span>
                          <span className="block text-xs text-[#78837C]">목적 달성 후 파기할 기준을 정하세요.</span>
                        </span>
                        <span className="flex items-center gap-2 text-sm text-[#17251F]">
                          <input
                            type="number"
                            min="1"
                            max="3650"
                            value={form.settings?.retentionDays ?? 180}
                            onChange={(e) => updateForm((f) => ({ ...f, settings: { ...f.settings, retentionDays: Number(e.target.value) || 180 } }))}
                            className="w-20 rounded-lg border border-[#C9CEC6] bg-[#FFFDF8] px-2 py-1.5 text-right outline-none focus:border-[#17251F]"
                          />일
                        </span>
                      </label>
                    </div>
                    <div className="border-t border-[#F0EEE6] pt-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-[#17251F]">개인정보 수집 안내 표시</div>
                          <div className="text-xs leading-5 text-[#78837C]">켜면 폼 소개 아래에 수집 목적·항목·보관기간 안내가 자동으로 표시돼요.</div>
                        </div>
                        <Toggle
                          checked={Boolean(form.settings?.privacyNotice)}
                          onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, privacyNotice: v } }))}
                        />
                      </div>
                      {form.settings?.privacyNotice && (
                        <div className="mt-3 space-y-3 rounded-lg border border-[#B7DCC8] bg-[#F6FCF8] p-3">
                          <label className="block text-xs font-medium text-[#355C45]">
                            수집 목적
                            <input
                              value={form.settings?.privacyPurpose || ""}
                              onChange={(e) => updateForm((f) => ({ ...f, settings: { ...f.settings, privacyPurpose: e.target.value } }))}
                              className="mt-1 w-full rounded-lg border border-[#C9CEC6] bg-white px-3 py-2 text-sm text-[#17251F] outline-none focus:border-[#17866D]"
                              placeholder="예: 행사 참석 확인 및 안내"
                            />
                          </label>
                          <label className="block text-xs font-medium text-[#355C45]">
                            수집 항목
                            <input
                              value={form.settings?.privacyItems || ""}
                              onChange={(e) => updateForm((f) => ({ ...f, settings: { ...f.settings, privacyItems: e.target.value } }))}
                              className="mt-1 w-full rounded-lg border border-[#C9CEC6] bg-white px-3 py-2 text-sm text-[#17251F] outline-none focus:border-[#17866D]"
                              placeholder="예: 이름, 연락처, 응답 내용"
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => addQuestion("privacy_consent")}
                              className="rounded-full border border-[#17866D] px-3 py-1.5 text-xs font-semibold text-[#0B4D3D] hover:bg-[#D8F5E8]"
                            >
                              동의 질문 추가
                            </button>
                            <label className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-[#355C45]">
                              <input
                                type="checkbox"
                                checked={Boolean(form.settings?.privacyThirdParty)}
                                onChange={(e) => updateForm((f) => ({ ...f, settings: { ...f.settings, privacyThirdParty: e.target.checked } }))}
                              />
                              제3자 제공 있음
                            </label>
                            <label className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-[#355C45]">
                              <input
                                type="checkbox"
                                checked={Boolean(form.settings?.privacyOutsourcing)}
                                onChange={(e) => updateForm((f) => ({ ...f, settings: { ...f.settings, privacyOutsourcing: e.target.checked } }))}
                              />
                              처리 위탁 있음
                            </label>
                          </div>
                          {!form.questions.some((q) => q.type === "privacy_consent") && (
                            <p className="rounded-md bg-[#FFF4E5] px-2.5 py-2 text-[11px] leading-5 text-[#8A4B08]">현재 폼에 동의 질문이 없어요. 개인정보를 수집한다면 `동의 질문 추가`를 함께 넣고, 목적·항목·보유기간을 실제 내용에 맞게 확인하세요.</p>
                          )}
                          <p className="text-[11px] leading-5 text-[#59645E]">자동 안내문은 고지 작성을 돕는 기능이며, 개인정보보호법 준수나 법적 책임 면제를 보장하지 않아요.</p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg bg-[#EAF6EF] px-3 py-2.5 text-xs leading-5 text-[#355C45]">
                      <strong>암호화 저장 중</strong> · 응답은 제출자의 브라우저에서 암호화되며, 이 브라우저에서만 복호화·내보내기됩니다.
                      <span className="mt-1 block text-[#59645E]">브라우저 저장 데이터를 삭제하거나 다른 기기에서 열면 기존 응답을 복호화할 수 없습니다. 파일럿 기간에는 브라우저 프로필을 유지하세요.</span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </div>

      {shareOpen && (
        <Modal title="공유" onClose={() => setShareOpen(false)}>
          <p className="mb-3 text-sm text-[#59645E]">이 링크가 있는 사람은 누구나 설문에 응답할 수 있어요.</p>
          <div className="flex items-center gap-2 rounded-lg border border-[#C9CEC6] p-2">
            <input readOnly value={shareUrl} className="min-w-0 flex-1 truncate bg-transparent text-sm outline-none" />
            <button
              onClick={copyLink}
              className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: accent }}
            >
              <Copy size={12} /> 복사
            </button>
          </div>
        </Modal>
      )}

      {collabOpen && (
        <Modal title="공동작업자" onClose={() => setCollabOpen(false)}>
          <p className="mb-3 text-xs leading-relaxed text-[#78837C]">
            이메일만 목록으로 저장돼요. 실제 초대 메일은 발송되지 않으니, 함께 편집할 사람에게는 위의 공유 링크를 직접 전달해주세요.
          </p>
          <div className="mb-3 flex gap-2">
            <input
              value={collabInput}
              onChange={(e) => setCollabInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCollaborator()}
              placeholder="email@example.com"
              className="min-w-0 flex-1 rounded-md border border-[#C9CEC6] px-3 py-2 text-sm outline-none focus:border-[#17866D]"
            />
            <button onClick={addCollaborator} className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-white" style={{ backgroundColor: accent }}>
              추가
            </button>
          </div>
          {(form.collaborators || []).length > 0 && (
            <ul className="space-y-1.5">
              {form.collaborators.map((email) => (
                <li key={email} className="flex items-center justify-between rounded-md bg-[#F5F3EC] px-3 py-1.5 text-sm text-[#17251F]">
                  {email}
                  <button onClick={() => removeCollaborator(email)} className="text-[#78837C] hover:text-[#B3261E]">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#17251F] px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
