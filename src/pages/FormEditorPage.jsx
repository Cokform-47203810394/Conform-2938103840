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
import { getFormDoc, saveFormDoc } from "../lib/formsStore";
import { emptyForm, defaultQuestion, uid } from "../questionTypes";
import { ELEV1, ELEV3, MD, NAVER_GREEN, CHART_PALETTE } from "../theme";

const PALETTE_SWATCHES = [MD.primary, ...CHART_PALETTE.filter((c) => c !== MD.primary), NAVER_GREEN];
const BACKGROUND_SWATCHES = ["#F5F3EC", "#FFFDF8", "#FFF2E8", "#EAF6EF", "#EAF1FB", "#FCEFEF"];

export default function FormEditorPage({ formId, onBack, onOpenAppSettings }) {
  const [form, setForm] = useState(emptyForm());
  const [responses, setResponses] = useState([]);
  const [tab, setTab] = useState("edit");
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  // ---- undo / redo (coalesces rapid edits into one checkpoint every 600ms) ----
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const applyingHistory = useRef(false);
  const pendingSnapshot = useRef(null);
  const historyTimer = useRef(null);

  const updateForm = useCallback((updater) => {
    setForm((prev) => {
      if (!applyingHistory.current) {
        if (pendingSnapshot.current === null) pendingSnapshot.current = prev;
        if (historyTimer.current) clearTimeout(historyTimer.current);
        historyTimer.current = setTimeout(() => {
          setPast((p) => [...p.slice(-49), pendingSnapshot.current]);
          setFuture([]);
          pendingSnapshot.current = null;
        }, 600);
      }
      return typeof updater === "function" ? updater(prev) : updater;
    });
  }, []);

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [form, ...f]);
    applyingHistory.current = true;
    setForm(previous);
    applyingHistory.current = false;
  };
  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, form]);
    applyingHistory.current = true;
    setForm(next);
    applyingHistory.current = false;
  };

  // ---- load / save ----
  useEffect(() => {
    setLoaded(false);
    setPast([]);
    setFuture([]);
    (async () => {
      const doc = await getFormDoc(formId);
      setForm(doc?.form || emptyForm());
      setResponses(doc?.responses || []);
      setLoaded(true);
    })();
  }, [formId]);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveFormDoc(formId, { form, responses });
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [form, responses, loaded, formId]);

  // ---- question CRUD ----
  const updateQuestion = (id, next) => {
    updateForm((f) => ({ ...f, questions: f.questions.map((q) => (q.id === id ? next : q)) }));
  };
  const deleteQuestion = (id) => {
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
  const addQuestion = () => {
    updateForm((f) => ({ ...f, questions: [...f.questions, defaultQuestion("short")] }));
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

  const handleFormSubmit = useCallback((answers) => {
    setResponses((r) => [...r, { id: uid(), submittedAt: new Date().toISOString(), answers }]);
  }, []);
  const clearResponses = () => setResponses([]);

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

  const addCollaborator = () => {
    const email = collabInput.trim();
    if (!email) return;
    updateForm((f) => ({ ...f, collaborators: [...new Set([...(f.collaborators || []), email])] }));
    setCollabInput("");
  };
  const removeCollaborator = (email) => {
    updateForm((f) => ({ ...f, collaborators: (f.collaborators || []).filter((e) => e !== email) }));
  };

  const tabs = [
    { id: "edit", label: "흐름" },
    { id: "responses", label: "답변", badge: responses.length },
    { id: "settings", label: "운영" },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: form.backgroundColor || "#F5F3EC" }}>
      <style>{`
        .safe-bottom { padding-bottom: max(6rem, calc(env(safe-area-inset-bottom) + 5rem)); }
        input, select, textarea, button { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* top app bar */}
      <div className={`sticky top-0 z-10 border-b border-[#DDE1D9] bg-[#FFFDF8]/95 backdrop-blur ${ELEV1}`}>
        <div className="mx-auto flex max-w-4xl items-center gap-1 px-3 py-3 sm:px-4">
          <IconButton title="홈으로" onClick={onBack}>
            <ArrowLeft size={18} />
          </IconButton>
          <input
            value={form.title}
            onChange={(e) => updateForm((f) => ({ ...f, title: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-base font-semibold tracking-[-0.03em] text-[#17251F] outline-none sm:text-lg"
          />
          <IconButton title={form.starred ? "즐겨찾기 해제" : "즐겨찾기"} onClick={() => updateForm((f) => ({ ...f, starred: !f.starred }))}>
            <Star size={18} fill={form.starred ? accent : "none"} color={form.starred ? accent : "currentColor"} />
          </IconButton>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 overflow-x-auto">
            <div className="relative">
              <IconButton title="테마 색상" onClick={() => setPaletteOpen((v) => !v)}>
                <Palette size={18} />
              </IconButton>
              {paletteOpen && (
                <Popover onClose={() => setPaletteOpen(false)} width="w-52">
                  <div className="mb-2 text-xs font-medium text-[#79747E]">테마 색상</div>
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
                  <div className="mb-2 text-xs font-medium text-[#79747E]">배경색</div>
                  <div className="grid grid-cols-6 gap-2">
                    {BACKGROUND_SWATCHES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          updateForm((f) => ({ ...f, backgroundColor: c }));
                          setPaletteOpen(false);
                        }}
                        className="h-7 w-7 rounded-full border border-[#E0E0E0] ring-2 ring-offset-2"
                        style={{ backgroundColor: c, ringColor: (form.backgroundColor || "#F3EDF7") === c ? MD.primary : "transparent" }}
                      />
                    ))}
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
            <button
              onClick={() => setShareOpen(true)}
              className="ml-1 shrink-0 rounded-full bg-[#17866D] px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(23,37,31,0.12)] transition hover:bg-[#0F705B]"
              style={{ backgroundColor: accent }}
            >
              공유 시작
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-4xl justify-center gap-8 border-t border-[#DDE1D9] px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 border-b-2 px-1 py-2.5 text-sm font-medium transition-colors ${
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
          <div className="py-16 text-center text-sm text-[#79747E]">불러오는 중…</div>
        ) : (
          <>
            {tab === "edit" && (
              <div className="space-y-3 sm:space-y-4">
                <div className="rounded-xl border-t-8 bg-white p-4 sm:p-5" style={{ borderTopColor: accent, boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15)" }}>
                  <RichTextInput
                    value={form.description}
                    onChange={(html) => updateForm((f) => ({ ...f, description: html }))}
                    placeholder="이 폼으로 무엇을 알고 싶은지 적어보세요"
                    className="min-h-[2.5rem] w-full text-base text-[#49454F] sm:text-sm"
                  />
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
                  onClick={addQuestion}
                  className={`fixed bottom-6 right-4 z-20 flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-medium text-white transition-shadow active:scale-95 sm:right-8 ${ELEV3}`}
                  style={{ backgroundColor: accent }}
                >
                  <Plus size={20} /> 질문 콕 찍기
                </button>
              </div>
            )}

            {tab === "responses" && <ResponsesView form={form} responses={responses} onClear={clearResponses} />}

            {tab === "settings" && (
              <div className="space-y-4">
                <div className={`rounded-xl bg-white p-5 ${ELEV1}`}>
                  <h3 className="mb-4 text-sm font-medium text-[#1C1B1F]">응답</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-[#1C1B1F]">이메일 주소 수집</div>
                        <div className="text-xs text-[#79747E]">응답 목록에 이메일 열을 표시해요</div>
                      </div>
                      <Toggle
                        checked={form.settings?.collectEmail}
                        onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, collectEmail: v } }))}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-[#1C1B1F]">응답 1회로 제한</div>
                        <div className="text-xs text-[#79747E]">같은 브라우저에서 중복 제출을 막아요</div>
                      </div>
                      <Toggle
                        checked={form.settings?.limitOneResponse}
                        onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, limitOneResponse: v } }))}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-[#1C1B1F]">응답 받는 중</div>
                        <div className="text-xs text-[#79747E]">꺼두면 공유 링크로 들어와도 제출할 수 없어요</div>
                      </div>
                      <Toggle
                        checked={form.settings?.acceptingResponses}
                        onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, acceptingResponses: v } }))}
                      />
                    </div>
                  </div>
                </div>

                <button onClick={onOpenAppSettings} className="text-sm font-medium hover:underline" style={{ color: accent }}>
                  데이터 저장소 · 계정 설정 열기 →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {shareOpen && (
        <Modal title="공유" onClose={() => setShareOpen(false)}>
          <p className="mb-3 text-sm text-[#49454F]">이 링크가 있는 사람은 누구나 설문에 응답할 수 있어요.</p>
          <div className="flex items-center gap-2 rounded-lg border border-[#CAC4D0] p-2">
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
          <p className="mb-3 text-xs leading-relaxed text-[#79747E]">
            이메일만 목록으로 저장돼요. 실제 초대 메일은 발송되지 않으니, 함께 편집할 사람에게는 위의 공유 링크를 직접 전달해주세요.
          </p>
          <div className="mb-3 flex gap-2">
            <input
              value={collabInput}
              onChange={(e) => setCollabInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCollaborator()}
              placeholder="email@example.com"
              className="min-w-0 flex-1 rounded-md border border-[#CAC4D0] px-3 py-2 text-sm outline-none focus:border-[#6750A4]"
            />
            <button onClick={addCollaborator} className="shrink-0 rounded-full px-3 py-2 text-sm font-medium text-white" style={{ backgroundColor: accent }}>
              추가
            </button>
          </div>
          {(form.collaborators || []).length > 0 && (
            <ul className="space-y-1.5">
              {form.collaborators.map((email) => (
                <li key={email} className="flex items-center justify-between rounded-md bg-[#F3EDF7] px-3 py-1.5 text-sm text-[#1C1B1F]">
                  {email}
                  <button onClick={() => removeCollaborator(email)} className="text-[#79747E] hover:text-[#B3261E]">
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#1C1B1F] px-4 py-2.5 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
