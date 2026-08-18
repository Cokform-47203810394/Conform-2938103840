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
  History,
  RotateCcw,
  Clock3,
  LockKeyhole,
  ShieldCheck,
  Download,
  Upload,
} from "lucide-react";
import QuestionEditor from "../components/QuestionEditor";
import RichTextInput from "../components/RichTextInput";
import PreviewForm from "../components/PreviewForm";
import ResponsesView from "../components/ResponsesView";
import { IconButton, Toggle } from "../components/Primitives";
import { Popover, Modal } from "../components/Overlay";
import { clearResponses as clearStoredResponses, exportFormRecoveryData, getFormDoc, getFormVersions, recordFormAuditEvent, restoreFormRecoveryData, saveFormDoc, saveFormVersion, submitResponse } from "../lib/formsStore";
import { emptyForm, defaultQuestion, uid } from "../questionTypes";
import {
  createEncryptedFormRecoveryBundle,
  ensureFormKeyPair,
  exportEncryptedKeyBackup,
  getFormKeyVaultState,
  importEncryptedKeyBackup,
  importRecoveryBundleKeyVault,
  openEncryptedFormRecoveryBundle,
  lockFormKeyVault,
  setupFormKeyVault,
  unlockFormKeyVault,
} from "../lib/secureResponses";
import { sanitizeImageSource } from "../lib/sanitizeRichText";
import { fromDateTimeLocalValue, getResponseWindowMessage, getResponseWindowState, toDateTimeLocalValue } from "../lib/responseWindow";
import { analyzePrivacyRisk, PRIVACY_AUDIT_LEVEL } from "../lib/privacyAudit";
import { ELEV1, ELEV3, MD, NAVER_GREEN, CHART_PALETTE } from "../theme";
import AuthControl from "../components/AuthControl";
import QuickAddToolbar from "../components/QuickAddToolbar";

const PALETTE_SWATCHES = [MD.primary, ...CHART_PALETTE.filter((c) => c !== MD.primary), NAVER_GREEN];
const BACKGROUND_SWATCHES = ["#F5F3EC", "#FFFDF8", "#FFF2E8", "#EAF6EF", "#EAF1FB", "#FCEFEF"];

function formatVersionDate(value) {
  if (!value) return "저장 시각 없음";
  return new Date(value).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function versionReasonLabel(reason) {
  if (reason === "initial") return "처음 저장";
  if (reason === "before_restore") return "복원 전 자동 보관";
  if (reason === "restore") return "이전 버전 복원";
  return "자동 저장";
}

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
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [keyVaultState, setKeyVaultState] = useState("checking");
  const [keyVaultOpen, setKeyVaultOpen] = useState(false);
  const [keyVaultBusy, setKeyVaultBusy] = useState(false);
  const [keyVaultError, setKeyVaultError] = useState("");
  const [recoveryPassphrase, setRecoveryPassphrase] = useState("");
  const [recoveryPassphraseConfirm, setRecoveryPassphraseConfirm] = useState("");
  const keyBackupInputRef = useRef(null);
  const recoveryBundleInputRef = useRef(null);
  const saveTimer = useRef(null);
  const versionTimer = useRef(null);
  const lastVersionFingerprint = useRef("");
  const loadedRef = useRef(false);
  const formRef = useRef(form);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  const finishSecureLoad = useCallback(async (keyPair) => {
    const doc = await getFormDoc(formId);
    let nextForm = normalizeForm(doc?.form);
    if (!nextForm.publicKey) nextForm = { ...nextForm, publicKey: keyPair.publicJwk };
    formRef.current = nextForm;
    setForm(nextForm);
    setResponses(doc?.responses || []);
    lastVersionFingerprint.current = JSON.stringify(nextForm);
    const loadedVersions = await getFormVersions(formId);
    if (loadedVersions.length) {
      setVersions(loadedVersions);
    } else {
      const created = await saveFormVersion(formId, nextForm, "initial");
      if (created) setVersions(await getFormVersions(formId));
    }
    setKeyVaultState("unlocked");
    setKeyVaultError("");
    setRecoveryPassphrase("");
    setRecoveryPassphraseConfirm("");
    loadedRef.current = true;
    setLoaded(true);
  }, [formId]);

  const loadFormStructure = useCallback(async () => {
    const doc = await getFormDoc(formId);
    const nextForm = normalizeForm(doc?.form);
    formRef.current = nextForm;
    setForm(nextForm);
    // A locked vault must never expose decrypted responses or version contents.
    setResponses([]);
    setVersions([]);
    lastVersionFingerprint.current = JSON.stringify(nextForm);
    loadedRef.current = true;
    setLoaded(true);
  }, [formId]);

  const handleKeyVaultUnlock = useCallback(async () => {
    setKeyVaultBusy(true);
    setKeyVaultError("");
    try {
      let keyPair;
      const needsSetup = ["setup_required", "legacy_unprotected"].includes(keyVaultState);
      if (needsSetup) {
        if (recoveryPassphrase !== recoveryPassphraseConfirm) {
          throw new Error("복구 비밀번호가 서로 다릅니다.");
        }
        keyPair = await setupFormKeyVault(formId, recoveryPassphrase);
      } else {
        keyPair = await unlockFormKeyVault(formId, recoveryPassphrase);
      }
      await finishSecureLoad(keyPair);
      setKeyVaultOpen(false);
    } catch (error) {
      setKeyVaultError(error?.message || "개인키 금고를 열지 못했습니다.");
    } finally {
      setKeyVaultBusy(false);
    }
  }, [finishSecureLoad, formId, keyVaultState, recoveryPassphrase, recoveryPassphraseConfirm]);

  const downloadKeyBackup = useCallback(() => {
    try {
      const backup = exportEncryptedKeyBackup(formId);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `cokform-key-${formId.slice(0, 8)}.cokform-key.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setKeyVaultError("");
    } catch (error) {
      setKeyVaultError(error?.message || "암호화 키 백업을 만들지 못했습니다.");
      setKeyVaultOpen(true);
    }
  }, [formId]);

  const handleKeyBackupImport = useCallback(async (file) => {
    if (!file) return;
    setKeyVaultBusy(true);
    setKeyVaultError("");
    try {
      const backup = JSON.parse(await file.text());
      if (backup?.formId !== formId) throw new Error("이 키 백업은 현재 열려 있는 폼의 것이 아닙니다.");
      importEncryptedKeyBackup(backup);
      setKeyVaultState("locked");
      setKeyVaultOpen(true);
      setRecoveryPassphrase("");
    } catch (error) {
      setKeyVaultError(error?.message || "암호화 키 백업 파일을 가져오지 못했습니다.");
    } finally {
      setKeyVaultBusy(false);
      if (keyBackupInputRef.current) keyBackupInputRef.current.value = "";
    }
  }, [formId]);

  const downloadRecoveryBundle = useCallback(async () => {
    if (!recoveryPassphrase) {
      setKeyVaultError("전체 복구 번들을 만들려면 복구 비밀번호를 다시 입력해 주세요.");
      setKeyVaultOpen(true);
      return;
    }
    setKeyVaultBusy(true);
    setKeyVaultError("");
    try {
      const payload = await exportFormRecoveryData(formId);
      const bundle = await createEncryptedFormRecoveryBundle(formId, payload, recoveryPassphrase);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `cokform-recovery-${formId.slice(0, 8)}.cokform-recovery.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      await recordFormAuditEvent(formId, "export", { format: "encrypted_recovery", responseCount: payload.responses?.length || 0 });
      setRecoveryPassphrase("");
    } catch (error) {
      setKeyVaultError(error?.message || "암호화 복구 번들을 만들지 못했습니다.");
    } finally {
      setKeyVaultBusy(false);
    }
  }, [formId, recoveryPassphrase]);

  const handleRecoveryBundleImport = useCallback(async (file) => {
    if (!file) return;
    setKeyVaultBusy(true);
    setKeyVaultError("");
    try {
      if (!recoveryPassphrase) throw new Error("복구 번들을 열 복구 비밀번호를 먼저 입력해 주세요.");
      const bundle = JSON.parse(await file.text());
      if (bundle?.formId !== formId) throw new Error("이 복구 번들은 현재 열려 있는 폼 ID와 다릅니다.");
      const payload = await openEncryptedFormRecoveryBundle(bundle, recoveryPassphrase);
      importRecoveryBundleKeyVault(bundle);
      const keyPair = await unlockFormKeyVault(formId, recoveryPassphrase);
      await restoreFormRecoveryData(payload);
      await finishSecureLoad(keyPair);
      setKeyVaultOpen(false);
    } catch (error) {
      setKeyVaultError(error?.message || "암호화 복구 번들을 가져오지 못했습니다.");
    } finally {
      setKeyVaultBusy(false);
      if (recoveryBundleInputRef.current) recoveryBundleInputRef.current.value = "";
    }
  }, [finishSecureLoad, formId, recoveryPassphrase]);

  const lockCurrentKeyVault = useCallback(() => {
    lockFormKeyVault(formId);
    // Keep form configuration editable, while immediately removing response
    // plaintext and decrypted versions from the current session.
    setResponses([]);
    setVersions([]);
    setTab("edit");
    setKeyVaultState("locked");
    setKeyVaultOpen(false);
    setRecoveryPassphrase("");
    setRecoveryPassphraseConfirm("");
  }, [formId]);

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
    setVersions([]);
    lastVersionFingerprint.current = "";
    pendingSnapshot.current = null;
    if (historyTimer.current) clearTimeout(historyTimer.current);
    if (versionTimer.current) clearTimeout(versionTimer.current);
    historyTimer.current = null;
    versionTimer.current = null;
    (async () => {
      const state = getFormKeyVaultState(formId);
      setKeyVaultState(state);
      setKeyVaultError("");
      if (state !== "unlocked") {
        // Form structure is not response plaintext. Let owners keep editing
        // while the vault remains locked; only response and history views
        // require an explicit unlock.
        try {
          await loadFormStructure();
          setKeyVaultOpen(false);
        } catch (error) {
          setKeyVaultError(error?.message || "폼을 불러오지 못했습니다.");
          setKeyVaultOpen(true);
        }
        return;
      }
      try {
        const keyPair = await ensureFormKeyPair(formId);
        await finishSecureLoad(keyPair);
      } catch (error) {
        setKeyVaultError(error?.message || "개인키 금고를 확인하지 못했습니다.");
        setKeyVaultState(getFormKeyVaultState(formId));
        setKeyVaultOpen(true);
      }
    })();
  }, [finishSecureLoad, formId, loadFormStructure]);

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

  useEffect(() => {
    if (!loaded || !form.publicKey) return undefined;
    const fingerprint = JSON.stringify(form);
    if (fingerprint === lastVersionFingerprint.current) return undefined;
    if (versionTimer.current) clearTimeout(versionTimer.current);
    versionTimer.current = setTimeout(async () => {
      const saved = await saveFormVersion(formId, form, "autosave");
      if (!saved) return;
      lastVersionFingerprint.current = fingerprint;
      setVersions(await getFormVersions(formId));
    }, 8_000);
    return () => clearTimeout(versionTimer.current);
  }, [form, formId, loaded]);

  const openVersionHistory = async () => {
    if (keyVaultState !== "unlocked") {
      setToast("버전 기록을 보려면 개인키 금고를 먼저 열어주세요.");
      setKeyVaultOpen(true);
      return;
    }
    setHistoryOpen(true);
    setVersionsLoading(true);
    try {
      setVersions(await getFormVersions(formId));
    } finally {
      setVersionsLoading(false);
    }
  };

  const requestVersionRestore = (version) => {
    setHistoryOpen(false);
    setConfirmAction({
      kind: "version",
      version,
      title: "이전 버전 복원",
      description: `${formatVersionDate(version.createdAt)}에 저장된 “${version.summary?.title || "제목 없는 설문지"}” 버전으로 돌아갑니다. 현재 상태도 먼저 암호화된 버전으로 보관합니다.`,
    });
  };

  // ---- question CRUD ----
  const updateQuestion = (id, next) => {
    updateForm((f) => ({ ...f, questions: f.questions.map((q) => (q.id === id ? next : q)) }));
  };
  const requestQuestionDelete = (id) => {
    setConfirmAction({ kind: "question", id, title: "질문 삭제", description: "이 질문을 삭제합니다. 저장 후에도 버전 기록에서 이전 상태를 확인할 수 있어요." });
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
      setToast("응답 저장에 실패했어요. 네트워크를 확인한 뒤 다시 시도해주세요.");
      return;
    }
    setResponses((r) => [...r, result.response]);
  }, [formId, form.publicKey]);
  const recordAuditEvent = useCallback((eventType, metadata) => recordFormAuditEvent(formId, eventType, metadata), [formId]);

  const requestClearResponses = () => {
    setConfirmAction({ kind: "responses", title: "모든 응답 삭제", description: "이 폼의 암호화된 응답을 모두 삭제합니다. 이 작업은 되돌릴 수 없습니다." });
  };

  const performConfirmation = async () => {
    if (!confirmAction || confirming) return;
    setConfirming(true);
    try {
      if (confirmAction.kind === "version") {
        const current = normalizeForm(formRef.current);
        await saveFormVersion(formId, current, "before_restore");
        const versionForm = normalizeForm(confirmAction.version.form);
        const restored = {
          ...versionForm,
          descriptionImage: versionForm.descriptionImage?.versionImageOmitted ? current.descriptionImage || null : versionForm.descriptionImage,
          coverImage: versionForm.coverImage?.versionImageOmitted ? current.coverImage || null : versionForm.coverImage,
        };
        const didSave = await saveFormDoc(formId, { form: restored });
        if (!didSave) {
          setToast("이전 버전을 저장하지 못했어요. 네트워크와 로그인 상태를 확인해주세요.");
          return;
        }
        formRef.current = restored;
        lastVersionFingerprint.current = JSON.stringify(restored);
        setForm(restored);
        await saveFormVersion(formId, restored, "restore");
        setVersions(await getFormVersions(formId));
        setConfirmAction(null);
        setToast("이전 버전으로 복원했습니다.");
        return;
      }
      if (confirmAction.kind === "question") {
        updateForm((f) => ({ ...f, questions: f.questions.filter((q) => q.id !== confirmAction.id) }));
        setConfirmAction(null);
        return;
      }
      if (confirmAction.kind === "responses") {
        const cleared = await clearStoredResponses(formId);
        if (!cleared) {
          setToast("응답을 삭제할 권한이 없거나 저장소에 연결되지 않았어요.");
          return;
        }
        await recordAuditEvent("responses_deleted", { responseCount: responses.length, source: "owner" });
        setResponses([]);
        setConfirmAction(null);
      }
    } finally {
      setConfirming(false);
    }
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
  const coverImageSrc = sanitizeImageSource(form.coverImage?.src);
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?respond=${formId}` : "";
  const privacyAudit = analyzePrivacyRisk(form);
  const responseWindowState = getResponseWindowState(form.settings);
  const responseScheduleInvalid = Boolean(
    form.settings?.responseStartAt
    && form.settings?.responseEndAt
    && new Date(form.settings.responseEndAt).getTime() <= new Date(form.settings.responseStartAt).getTime(),
  );

  const openShare = () => {
    if (!form.publicKey) {
      setKeyVaultOpen(true);
      setToast("공개하기 전 개인키 금고를 만들고 응답 암호화를 설정해주세요.");
      return;
    }
    if (privacyAudit.blocking.length) {
      setTab("settings");
      setToast("고유식별정보 또는 민감정보로 보이는 질문이 있어 공개 공유를 중단했어요. 설정의 개인정보 점검을 먼저 확인하세요.");
      return;
    }
    setShareOpen(true);
  };

  const copyLink = async () => {
    if (!form.publicKey) {
      setKeyVaultOpen(true);
      setToast("암호화 키를 만든 뒤에만 공개 링크를 복사할 수 있어요.");
      return;
    }
    if (privacyAudit.blocking.length) {
      setTab("settings");
      setToast("고위험 개인정보 질문을 확인하기 전에는 공개 링크를 복사할 수 없어요.");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setToast("링크가 복사되었습니다");
    } catch {
      setToast("복사에 실패했어요. 링크를 직접 선택해 복사해주세요.");
    }
  };

  const handleImageUpload = (field, file) => {
    if (!file) return;
    if (!new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]).has(file.type)) {
      setToast("PNG, JPG, GIF, WebP 이미지만 넣을 수 있어요.");
      return;
    }
    const limit = field === "coverImage" ? 1 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > limit) {
      setToast(`${field === "coverImage" ? "커버 이미지는" : "이미지는"} ${field === "coverImage" ? "1MB" : "2MB"} 이하로 넣어주세요.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = sanitizeImageSource(reader.result);
      if (!src) {
        setToast("안전한 이미지 형식인지 확인해주세요.");
        return;
      }
      updateForm((f) => ({ ...f, [field]: { src, alt: file.name.replace(/\\.[^.]+$/, "") } }));
    };
    reader.readAsDataURL(file);
  };

  const handleDescriptionImageUpload = (file) => handleImageUpload("descriptionImage", file);
  const handleCoverImageUpload = (file) => handleImageUpload("coverImage", file);

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
            <IconButton title="버전 기록" onClick={openVersionHistory}>
              <History size={18} />
            </IconButton>
            <IconButton title="링크 복사" onClick={copyLink}>
              <LinkIcon size={18} />
            </IconButton>
            <IconButton title="공동작업자" onClick={() => setCollabOpen(true)}>
              <UserPlus size={18} />
            </IconButton>
            <AuthControl user={user} showLogout={false} />
            <button
              onClick={openShare}
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
          <IconButton title="버전 기록" onClick={openVersionHistory}><History size={17} /></IconButton>
          <IconButton title="링크 복사" onClick={copyLink}><LinkIcon size={17} /></IconButton>
          <button type="button" onClick={openShare} className="ml-1 flex-1 rounded-full px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: accent }}>공유</button>
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
              onClick={() => {
                if (t.id === "responses" && keyVaultState !== "unlocked") {
                  setToast("응답을 보려면 개인키 금고를 먼저 열어주세요.");
                  setKeyVaultOpen(true);
                  return;
                }
                setTab(t.id);
              }}
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
                      <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={(e) => handleDescriptionImageUpload(e.target.files?.[0])} />
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
                    onDelete={() => requestQuestionDelete(q.id)}
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
                  className={`fixed bottom-6 right-4 z-20 flex items-center gap-2 rounded-2xl px-5 py-4 text-sm font-medium text-white transition-colors duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:right-8 lg:hidden ${ELEV3}`}
                  style={{ backgroundColor: accent }}
                >
                  <Plus size={20} /> 질문 추가
                </button>
              </div>
            )}

            {tab === "responses" && canViewResponses && (
              <div>
                <div className="mb-3 text-xs font-medium text-[#59645E]">작성자 전용 · 이 폼의 소유자만 응답을 복호화하고 내보낼 수 있어요.</div>
                <ResponsesView form={form} formId={formId} responses={responses} onClear={requestClearResponses} onAudit={recordAuditEvent} />
              </div>
            )}

            {tab === "settings" && (
              <div className="space-y-4">
                <div className={`rounded-xl bg-white p-5 ${ELEV1}`}>
                  <h3 className="mb-4 text-sm font-medium text-[#17251F]">응답</h3>
                  {(form.settings?.collectEmail || form.questions.some((q) => q.type === "privacy_consent")) && !form.settings?.privacyNotice && (
                    <div className="rounded-lg border border-[#E4C77A] bg-[#FFF8DE] px-3 py-2.5 text-xs leading-5 text-[#65521A]">개인정보 항목을 수집하는 폼이에요. 응답자가 확인할 수 있도록 아래의 <strong>개인정보 수집 안내 표시</strong>를 켜고 목적·항목·보관기간을 작성하세요.</div>
                  )}
                  {privacyAudit.signals.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-[#E4C77A] bg-[#FFFDF2] p-3">
                      <div className="text-xs font-semibold text-[#65521A]">개인정보 점검 · 질문 제목과 설정만 확인하며 응답 내용은 읽지 않아요.</div>
                      {privacyAudit.signals.map((item, index) => (
                        <div key={`${item.code}-${item.questionId || index}`} className="rounded-md px-2.5 py-2 text-[11px] leading-5" style={{ color: PRIVACY_AUDIT_LEVEL[item.level].color, backgroundColor: PRIVACY_AUDIT_LEVEL[item.level].background }}>
                          <strong>{PRIVACY_AUDIT_LEVEL[item.level].label}</strong> · {item.message}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-4">
                    <section className="overflow-hidden rounded-xl border border-[#DDE1D9] bg-[#F8F9F4]">
                      <div className="border-b border-[#DDE1D9] px-3.5 py-3">
                        <div className="text-sm font-semibold text-[#17251F]">첫 화면 커버 이미지</div>
                        <p className="mt-1 text-xs leading-5 text-[#78837C]">내가 만든 폼 카드에만 표시되는 16:9 이미지예요. 공개 응답 화면에는 노출하지 않아요.</p>
                      </div>
                      <div className="grid gap-3 p-3.5 sm:grid-cols-[10.5rem_1fr]">
                        <div className="aspect-video overflow-hidden rounded-lg border border-[#DDE1D9] bg-[#F5F3EC]">
                          {coverImageSrc ? <img src={coverImageSrc} alt={form.coverImage?.alt || "폼 커버 이미지"} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center px-3 text-center text-[11px] leading-4 text-[#78837C]">커버 이미지를 넣으면 첫 화면 카드에 표시돼요.</div>}
                        </div>
                        <div className="min-w-0 space-y-2">
                          <label className="inline-flex cursor-pointer items-center rounded-full border border-[#C9CEC6] bg-white px-3 py-1.5 text-xs font-semibold text-[#59645E] hover:border-[#17866D] hover:bg-[#F1FAF4]">
                            {coverImageSrc ? "커버 이미지 교체" : "커버 이미지 추가"}
                            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="sr-only" onChange={(event) => handleCoverImageUpload(event.target.files?.[0])} />
                          </label>
                          <input
                            value={form.coverImage?.src?.startsWith("data:") ? "" : form.coverImage?.src || ""}
                            onChange={(event) => updateForm((current) => ({ ...current, coverImage: event.target.value ? { ...(current.coverImage || {}), src: event.target.value } : null }))}
                            onBlur={() => updateForm((current) => ({ ...current, coverImage: sanitizeImageSource(current.coverImage?.src) ? current.coverImage : null }))}
                            placeholder="HTTPS 이미지 URL 붙여넣기"
                            className="w-full rounded-lg border border-[#C9CEC6] bg-white px-3 py-2 text-xs text-[#17251F] outline-none focus:border-[#17866D]"
                          />
                          {form.coverImage?.src && (
                            <div className="flex flex-wrap gap-2">
                              <input
                                value={form.coverImage.alt || ""}
                                onChange={(event) => updateForm((current) => ({ ...current, coverImage: { ...current.coverImage, alt: event.target.value } }))}
                                placeholder="대체텍스트"
                                className="min-w-[9rem] flex-1 rounded-lg border border-[#C9CEC6] bg-white px-3 py-2 text-xs text-[#17251F] outline-none focus:border-[#17866D]"
                              />
                              <button type="button" onClick={() => updateForm((current) => ({ ...current, coverImage: null }))} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#B3261E] hover:bg-[#FBE4E0]">삭제</button>
                            </div>
                          )}
                          <p className="text-[11px] leading-5 text-[#78837C]">PNG·JPG·GIF·WebP, 최대 1MB. 민감한 원본 이미지는 넣지 마세요.</p>
                        </div>
                      </div>
                    </section>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm font-medium text-[#17251F]">이메일 주소 기록</div>
                        <div className="text-xs leading-5 text-[#78837C]">켜면 응답자에게 기록 사실을 고지하고, 필수 이메일 입력칸이 표시돼요. 이메일은 응답과 함께 암호화해 저장됩니다.</div>
                      </div>
                      <Toggle
                        checked={form.settings?.collectEmail}
                        onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, collectEmail: v } }))}
                      />
                    </div>
                    {form.settings?.collectEmail && (
                      <div className="ml-3 space-y-3 rounded-lg border border-[#DDE1D9] bg-[#F8F9F4] p-3">
                        <div className="flex items-center justify-between gap-4">
                          <div><div className="text-sm text-[#17251F]">응답자에게 사본 요청 허용</div><div className="text-xs leading-5 text-[#78837C]">응답자가 이메일을 입력하고 본인 응답 사본을 요청할 수 있어요.</div></div>
                          <Toggle checked={Boolean(form.settings?.responseReceipt)} onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, responseReceipt: v } }))} />
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div><div className="text-sm text-[#17251F]">새 응답 알림</div><div className="text-xs leading-5 text-[#78837C]">새 응답이 오면 작성자 계정에 알림이 표시돼요.</div></div>
                          <Toggle checked={Boolean(form.settings?.ownerResponseNotification)} onChange={(v) => updateForm((f) => ({ ...f, settings: { ...f.settings, ownerResponseNotification: v } }))} />
                        </div>
                      </div>
                    )}
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
                    <section className="rounded-xl border border-[#DDE1D9] bg-[#F8F9F4] p-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[#17251F]">응답 기간과 마감</div>
                          <p className="mt-1 text-xs leading-5 text-[#78837C]">시작·마감 시각을 비워 두면 기간 제한 없이 응답을 받아요. 시간은 폼 작성자의 현재 시간대를 기준으로 설정됩니다.</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${responseWindowState === "open" ? "bg-[#D8F5E8] text-[#0B4D3D]" : "bg-[#FBE4E0] text-[#B3261E]"}`}>{responseWindowState === "open" ? "응답 받는 중" : responseWindowState === "not_started" ? "시작 전" : "마감"}</span>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-xs font-medium text-[#355C45]">
                          응답 시작
                          <div className="mt-1 flex gap-1.5">
                            <input type="datetime-local" value={toDateTimeLocalValue(form.settings?.responseStartAt)} onChange={(event) => updateForm((current) => ({ ...current, settings: { ...current.settings, responseStartAt: fromDateTimeLocalValue(event.target.value) } }))} className="min-w-0 flex-1 rounded-lg border border-[#C9CEC6] bg-white px-2.5 py-2 text-xs text-[#17251F] outline-none focus:border-[#17866D]" />
                            {form.settings?.responseStartAt && <button type="button" onClick={() => updateForm((current) => ({ ...current, settings: { ...current.settings, responseStartAt: null } }))} className="rounded-lg px-2 text-xs text-[#78837C] hover:bg-white">해제</button>}
                          </div>
                        </label>
                        <label className="block text-xs font-medium text-[#355C45]">
                          응답 마감
                          <div className="mt-1 flex gap-1.5">
                            <input type="datetime-local" value={toDateTimeLocalValue(form.settings?.responseEndAt)} onChange={(event) => updateForm((current) => ({ ...current, settings: { ...current.settings, responseEndAt: fromDateTimeLocalValue(event.target.value) } }))} className="min-w-0 flex-1 rounded-lg border border-[#C9CEC6] bg-white px-2.5 py-2 text-xs text-[#17251F] outline-none focus:border-[#17866D]" />
                            {form.settings?.responseEndAt && <button type="button" onClick={() => updateForm((current) => ({ ...current, settings: { ...current.settings, responseEndAt: null } }))} className="rounded-lg px-2 text-xs text-[#78837C] hover:bg-white">해제</button>}
                          </div>
                        </label>
                      </div>
                      {responseScheduleInvalid && <p className="mt-3 rounded-lg bg-[#FFF4E5] px-3 py-2 text-xs leading-5 text-[#8A4B08]">마감 시각은 시작 시각보다 뒤여야 해요. 이 상태에서는 기간을 다시 설정해 주세요.</p>}
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-[#DDE1D9] pt-3">
                        <button type="button" onClick={() => updateForm((current) => ({ ...current, settings: { ...current.settings, acceptingResponses: false } }))} disabled={form.settings?.acceptingResponses === false} className="rounded-full border border-[#E9B8B1] bg-white px-3 py-1.5 text-xs font-semibold text-[#B3261E] hover:bg-[#FBE4E0] disabled:cursor-not-allowed disabled:opacity-50">지금 마감하기</button>
                        <button type="button" onClick={() => updateForm((current) => ({ ...current, settings: { ...current.settings, acceptingResponses: true, responseStartAt: null, responseEndAt: null } }))} disabled={responseWindowState === "open" && !form.settings?.responseStartAt && !form.settings?.responseEndAt} className="rounded-full border border-[#B7DCC8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B4D3D] hover:bg-[#EAF6EF] disabled:cursor-not-allowed disabled:opacity-50">지금 다시 열기</button>
                        <span className="self-center text-[11px] text-[#78837C]">{getResponseWindowMessage(responseWindowState, form.settings)}</span>
                      </div>
                    </section>
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
                          {form.settings?.privacyThirdParty && (
                            <label className="block text-xs font-medium text-[#355C45]">
                              제3자 제공 상세
                              <textarea value={form.settings?.privacyThirdPartyDetails || ""} onChange={(e) => updateForm((f) => ({ ...f, settings: { ...f.settings, privacyThirdPartyDetails: e.target.value } }))} rows={2} placeholder="예: 제공받는 자, 제공 목적, 제공 항목, 보유기간, 동의 거부권·불이익" className="mt-1 w-full rounded-lg border border-[#C9CEC6] bg-white px-3 py-2 text-sm text-[#17251F] outline-none focus:border-[#17866D]" />
                            </label>
                          )}
                          {form.settings?.privacyOutsourcing && (
                            <label className="block text-xs font-medium text-[#355C45]">
                              처리 위탁 상세
                              <textarea value={form.settings?.privacyOutsourcingDetails || ""} onChange={(e) => updateForm((f) => ({ ...f, settings: { ...f.settings, privacyOutsourcingDetails: e.target.value } }))} rows={2} placeholder="예: 수탁자와 위탁 업무 내용" className="mt-1 w-full rounded-lg border border-[#C9CEC6] bg-white px-3 py-2 text-sm text-[#17251F] outline-none focus:border-[#17866D]" />
                            </label>
                          )}
                          {!form.questions.some((q) => q.type === "privacy_consent") && (
                            <p className="rounded-md bg-[#FFF4E5] px-2.5 py-2 text-[11px] leading-5 text-[#8A4B08]">현재 폼에 동의 질문이 없어요. 개인정보를 수집한다면 `동의 질문 추가`를 함께 넣고, 목적·항목·보유기간을 실제 내용에 맞게 확인하세요.</p>
                          )}
                          <p className="text-[11px] leading-5 text-[#59645E]">자동 안내문은 고지 작성을 돕는 기능이며, 개인정보보호법 준수나 법적 책임 면제를 보장하지 않아요.</p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg bg-[#EAF6EF] px-3 py-2.5 text-xs leading-5 text-[#355C45]">
                      <strong>종단간 암호화</strong> · 응답은 제출자의 브라우저에서 암호화되고, Cokform·Supabase·Cloudflare에는 복호화 키가 저장되지 않습니다.
                      <span className="mt-1 block text-[#59645E]">응답을 열 때만 이 브라우저에서 개인키 금고를 잠금 해제합니다. 금고가 잠기면 응답 평문은 화면과 메모리에서 즉시 비웁니다.</span>
                    </div>
                    <div className="rounded-xl border border-[#B7DCC8] bg-[#F6FCF8] p-3.5">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 rounded-lg bg-[#D8F5E8] p-2 text-[#0B4D3D]"><ShieldCheck size={16} /></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[#17251F]">개인키 금고와 복구</div>
                          <p className="mt-1 text-xs leading-5 text-[#59645E]">개인키는 600,000회 PBKDF2와 AES-256-GCM으로 이 기기에 암호화해 보관합니다. 복구 비밀번호와 키 백업 파일이 모두 없으면 응답 복구는 불가능합니다.</p>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                            <span className={`rounded-full px-2 py-1 font-semibold ${keyVaultState === "unlocked" ? "bg-[#D8F5E8] text-[#0B4D3D]" : "bg-[#FFF4E5] text-[#8A4B08]"}`}>{keyVaultState === "unlocked" ? "이 세션에서 잠금 해제됨" : "개인키 금고 잠김"}</span>
                            <span className="text-[#78837C]">Cokform은 복구 비밀번호를 알거나 재설정할 수 없어요.</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => setKeyVaultOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[#B7DCC8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B4D3D] hover:bg-[#EAF6EF]"><LockKeyhole size={13} /> {keyVaultState === "unlocked" ? "금고 관리" : "금고 열기"}</button>
                            <button type="button" onClick={downloadKeyBackup} className="inline-flex items-center gap-1.5 rounded-full border border-[#B7DCC8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B4D3D] hover:bg-[#EAF6EF]"><Download size={13} /> 암호화 키 백업</button>
                            <button type="button" onClick={() => setKeyVaultOpen(true)} className="inline-flex items-center gap-1.5 rounded-full border border-[#B7DCC8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B4D3D] hover:bg-[#EAF6EF]"><Download size={13} /> 전체 복구 번들</button>
                            <button type="button" onClick={() => keyBackupInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-full border border-[#B7DCC8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B4D3D] hover:bg-[#EAF6EF]"><Upload size={13} /> 키 백업 가져오기</button>
                            {keyVaultState === "unlocked" && <button type="button" onClick={lockCurrentKeyVault} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#59645E] hover:bg-white"><LockKeyhole size={13} /> 지금 잠그기</button>}
                          </div>
                          <input ref={keyBackupInputRef} type="file" accept="application/json,.cokform-key.json" className="sr-only" onChange={(event) => handleKeyBackupImport(event.target.files?.[0])} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </div>

      {keyVaultOpen && (
        <Modal title="개인키 금고" onClose={() => setKeyVaultOpen(false)}>
          <div className="space-y-4">
            <div className="rounded-xl border border-[#B7DCC8] bg-[#F6FCF8] p-3 text-xs leading-5 text-[#355C45]">
              <div className="flex items-center gap-2 font-semibold text-[#0B4D3D]"><LockKeyhole size={15} /> 작성자만 아는 복구 비밀번호</div>
              <p className="mt-1">개인키는 이 기기에 암호화해 보관됩니다. Cokform·Supabase·Cloudflare는 이 비밀번호와 개인키를 저장하거나 재설정할 수 없습니다.</p>
            </div>

            {keyVaultState === "legacy_unprotected" && <p className="rounded-lg bg-[#FFF4E5] px-3 py-2.5 text-xs leading-5 text-[#8A4B08]">기존 개인키가 안전하지 않은 브라우저 저장소에 있습니다. 계속하면 평문 키를 삭제하고 암호화 금고로 옮깁니다.</p>}
            {keyVaultState === "setup_required" && <p className="text-xs leading-5 text-[#59645E]">이 폼은 아직 개인키가 없습니다. 복구 비밀번호를 만들면 공개키와 개인키를 생성하고, 이후 응답은 이 키로만 복호화할 수 있습니다.</p>}
            {keyVaultState === "locked" && <p className="text-xs leading-5 text-[#59645E]">응답과 암호화된 버전 기록을 보려면 복구 비밀번호로 이 기기의 개인키 금고를 열어야 합니다.</p>}

            <label className="block text-xs font-semibold text-[#355C45]">
              {keyVaultState === "setup_required" || keyVaultState === "legacy_unprotected" ? "새 복구 비밀번호" : "복구 비밀번호"}
              <input
                type="password"
                autoComplete={["setup_required", "legacy_unprotected"].includes(keyVaultState) ? "new-password" : "current-password"}
                value={recoveryPassphrase}
                onChange={(event) => setRecoveryPassphrase(event.target.value)}
                placeholder="12자 이상, 다른 서비스와 다른 문구"
                className="mt-1.5 w-full rounded-lg border border-[#C9CEC6] bg-white px-3 py-2.5 text-sm text-[#17251F] outline-none focus:border-[#17866D]"
              />
            </label>
            {["setup_required", "legacy_unprotected"].includes(keyVaultState) && (
              <label className="block text-xs font-semibold text-[#355C45]">
                복구 비밀번호 다시 입력
                <input
                  type="password"
                  autoComplete="new-password"
                  value={recoveryPassphraseConfirm}
                  onChange={(event) => setRecoveryPassphraseConfirm(event.target.value)}
                  placeholder="같은 비밀번호를 한 번 더 입력"
                  className="mt-1.5 w-full rounded-lg border border-[#C9CEC6] bg-white px-3 py-2.5 text-sm text-[#17251F] outline-none focus:border-[#17866D]"
                />
              </label>
            )}
            {keyVaultError && <p className="rounded-lg bg-[#FBE4E0] px-3 py-2 text-xs leading-5 text-[#B3261E]">{keyVaultError}</p>}

            <div className="flex flex-wrap justify-end gap-2 border-t border-[#F0EEE6] pt-4">
              <button type="button" onClick={() => recoveryBundleInputRef.current?.click()} disabled={keyVaultBusy || !recoveryPassphrase} className="inline-flex items-center gap-1.5 rounded-full border border-[#C9CEC6] bg-white px-3 py-2 text-xs font-semibold text-[#59645E] hover:bg-[#F5F3EC] disabled:opacity-50"><Upload size={13} /> 전체 복구 가져오기</button>
              <button type="button" onClick={() => keyBackupInputRef.current?.click()} disabled={keyVaultBusy} className="inline-flex items-center gap-1.5 rounded-full border border-[#C9CEC6] bg-white px-3 py-2 text-xs font-semibold text-[#59645E] hover:bg-[#F5F3EC] disabled:opacity-50"><Upload size={13} /> 키 백업 가져오기</button>
              {keyVaultState === "unlocked" && <button type="button" onClick={downloadRecoveryBundle} disabled={keyVaultBusy || !recoveryPassphrase} className="inline-flex items-center gap-1.5 rounded-full border border-[#B7DCC8] bg-white px-3 py-2 text-xs font-semibold text-[#0B4D3D] hover:bg-[#EAF6EF] disabled:opacity-50"><Download size={13} /> 전체 복구 번들</button>}
              <button type="button" onClick={handleKeyVaultUnlock} disabled={keyVaultBusy || !recoveryPassphrase} className="inline-flex items-center gap-1.5 rounded-full bg-[#17866D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0F705B] disabled:cursor-wait disabled:opacity-60"><LockKeyhole size={13} /> {keyVaultBusy ? "보호 중…" : ["setup_required", "legacy_unprotected"].includes(keyVaultState) ? "금고 만들기" : "금고 열기"}</button>
            </div>
            <input ref={recoveryBundleInputRef} type="file" accept="application/json,.cokform-recovery.json" className="sr-only" onChange={(event) => handleRecoveryBundleImport(event.target.files?.[0])} />
            <p className="text-[11px] leading-5 text-[#78837C]">`.cokform-recovery.json`에는 개인키 금고와 응답 암호문·폼·버전이 모두 다시 암호화되어 들어갑니다. 복구 비밀번호와 파일은 서로 다른 안전한 곳에 보관하세요.</p>
          </div>
        </Modal>
      )}

      {historyOpen && (
        <Modal title="버전 기록" onClose={() => setHistoryOpen(false)}>
          <p className="mb-4 text-xs leading-5 text-[#59645E]">변경 후 8초간 입력이 멈추면 현재 폼 구조·설정이 암호화된 상태로 자동 보관됩니다. 응답 원문과 업로드 이미지 원본은 복원 대상에 포함되지 않습니다.</p>
          {versionsLoading ? (
            <div className="py-8 text-center text-sm text-[#78837C]">버전 기록을 불러오는 중…</div>
          ) : versions.length ? (
            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {versions.map((version, index) => (
                <article key={version.id} className="rounded-xl border border-[#DDE1D9] bg-[#FFFDF8] p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 rounded-lg bg-[#EAF6EF] p-1.5 text-[#17866D]"><Clock3 size={14} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm text-[#17251F]">{version.summary?.title || "제목 없는 설문지"}</strong>{index === 0 && <span className="rounded-full bg-[#D8ED59] px-1.5 py-0.5 text-[10px] font-bold text-[#17251F]">최신</span>}</div>
                      <p className="mt-1 text-xs text-[#78837C]">{formatVersionDate(version.createdAt)} · 질문 {version.summary?.questionCount ?? version.form.questions?.length ?? 0}개 · {versionReasonLabel(version.summary?.reason)}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => requestVersionRestore(version)} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#B7DCC8] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B4D3D] transition-colors hover:bg-[#EAF6EF]"><RotateCcw size={13} /> 이 버전으로 복원</button>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#C9CEC6] bg-[#F8F9F4] px-4 py-8 text-center text-sm leading-6 text-[#78837C]">아직 복원할 버전이 없어요. 폼을 수정하면 자동저장 버전이 여기에 쌓입니다.</div>
          )}
        </Modal>
      )}

      {confirmAction && (
        <Modal title={confirmAction.title} onClose={() => !confirming && setConfirmAction(null)}>
          <p className="text-sm leading-6 text-[#59645E]">{confirmAction.description}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmAction(null)} disabled={confirming} className="rounded-full border border-[#C9CEC6] bg-white px-4 py-2 text-sm font-semibold text-[#59645E] transition-colors hover:bg-[#F5F3EC] disabled:opacity-50">취소</button>
            <button type="button" onClick={performConfirmation} disabled={confirming} className="rounded-full bg-[#B3261E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8C1D18] disabled:cursor-wait disabled:opacity-60">{confirming ? "처리 중…" : "삭제"}</button>
          </div>
        </Modal>
      )}

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
