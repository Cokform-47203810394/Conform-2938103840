import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Settings, Plus, MoreVertical, Copy, Trash2, ExternalLink, ArrowUpDown, Bell, Eye, BarChart3, CheckCircle2, ChevronLeft, ChevronRight, Pause, Play, X, Mail } from "lucide-react";
import AuthControl from "../components/AuthControl";
import { signInWithGoogle } from "../lib/auth";
import FormThumbnail from "../components/FormThumbnail";
import { Modal } from "../components/Overlay";
import { TEMPLATES, PREMIUM_TEMPLATES } from "../templates";
import { listForms, listParticipatedForms, listOwnerNotifications, markOwnerNotificationsRead, saveFormDoc, deleteFormDoc, duplicateFormDoc, newFormId } from "../lib/formsStore";
import { MD } from "../theme";
import { sanitizeImageSource } from "../lib/sanitizeRichText";
import { getResponseWindowState } from "../lib/responseWindow";

function formResponseState(form) {
  return getResponseWindowState({
    acceptingResponses: form.acceptingResponses,
    responseStartAt: form.responseStartAt,
    responseEndAt: form.responseEndAt,
  });
}

function formResponseLabel(form) {
  const state = formResponseState(form);
  if (state === "open") return "응답 중";
  if (state === "not_started") return "시작 전";
  if (state === "ended") return "기간 마감";
  return "마감";
}

function formatRelative(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return "오늘";
  if (diffMs < 2 * day) return "어제";
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function HomePage({ onOpenForm, onOpenSettings, user, authReady }) {
  const [forms, setForms] = useState([]);
  const [participatedForms, setParticipatedForms] = useState([]);
  const [responseNotifications, setResponseNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("updated"); // 'updated' | 'title'
  const [openMenuId, setOpenMenuId] = useState(null);
  const [creating, setCreating] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const searchPanelRef = useRef(null);
  const notificationsPanelRef = useRef(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [created, participated, notifications] = await Promise.all([listForms(), listParticipatedForms(), listOwnerNotifications()]);
    setForms(created);
    setParticipatedForms(participated);
    setResponseNotifications(notifications);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

  useEffect(() => {
    const dismissFloatingPanels = (event) => {
      if (!searchPanelRef.current?.contains(event.target)) setSearchFocused(false);
      if (!notificationsPanelRef.current?.contains(event.target)) setNotificationsOpen(false);
    };
    const dismissWithEscape = (event) => {
      if (event.key !== "Escape") return;
      setSearchFocused(false);
      setNotificationsOpen(false);
    };
    document.addEventListener("mousedown", dismissFloatingPanels);
    window.addEventListener("keydown", dismissWithEscape);
    return () => {
      document.removeEventListener("mousedown", dismissFloatingPanels);
      window.removeEventListener("keydown", dismissWithEscape);
    };
  }, []);

  const openParticipatedForm = (id) => {
    window.location.href = `${window.location.origin}/?respond=${encodeURIComponent(id)}`;
  };

  const filtered = useMemo(() => {
    let list = forms;
    if (query.trim()) {
      const kw = query.trim().toLowerCase();
      list = list.filter((f) => f.title?.toLowerCase().includes(kw));
    }
    if (sortBy === "title") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title, "ko"));
    } else {
      list = [...list].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }
    return list;
  }, [forms, query, sortBy]);

  const suggestions = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) return [];
    return forms
      .map((f) => ({ form: f, score: matchScore(f.title, kw) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || new Date(b.form.updatedAt) - new Date(a.form.updatedAt))
      .slice(0, 6)
      .map((item) => item.form);
  }, [forms, query]);

  const totals = useMemo(() => ({
    forms: forms.length,
    views: forms.reduce((sum, f) => sum + (f.viewCount || 0), 0),
    responses: forms.reduce((sum, f) => sum + (f.responseCount || 0), 0),
    active: forms.filter((f) => f.acceptingResponses !== false).length,
  }), [forms]);

  const notifications = useMemo(() => responseNotifications
    .map((notification) => ({ ...notification, form: forms.find((form) => form.id === notification.formId) }))
    .filter((notification) => notification.form)
    .slice(0, 10), [responseNotifications, forms]);
  const unreadNotificationCount = notifications.filter((notification) => !notification.readAt).length;

  const openNotification = async (notification) => {
    setNotificationsOpen(false);
    if (!notification.readAt) {
      await markOwnerNotificationsRead(notification.id);
      setResponseNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item));
    }
    onOpenForm(notification.formId);
  };

  const handleCreate = async (template) => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    setCreating(template.key);
    const id = newFormId();
    const form = template.build();
    await saveFormDoc(id, { form, responses: [] });
    onOpenForm(id);
  };

  const handleDuplicate = async (id) => {
    setOpenMenuId(null);
    const newId = await duplicateFormDoc(id);
    if (newId) refresh();
  };

  const handleDuplicateAndOpen = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    const source = [...forms].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    if (!source) return;
    setCreating("copy");
    try {
      const newId = await duplicateFormDoc(source.id);
      if (newId) onOpenForm(newId);
    } finally {
      setCreating(null);
    }
  };

  const requestDelete = (id, title) => {
    setOpenMenuId(null);
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    const target = deleteTarget;
    setDeleting(true);
    try {
      const deleted = await deleteFormDoc(target.id);
      if (!deleted) {
        setNotice("삭제하지 못했어요. 로그인 상태와 폼 소유자 권한을 확인해주세요.");
        window.setTimeout(() => setNotice(null), 3500);
        return;
      }
      setDeleteTarget(null);
      setNotice("폼과 응답이 삭제되었습니다.");
      window.setTimeout(() => setNotice(null), 2500);
      await refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F3EC]">
      {/* top bar */}
      <div className="sticky top-0 z-10 border-b border-[#DDE1D9] bg-[#FFFDF8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-3 py-3 sm:flex-nowrap sm:gap-3 sm:px-6">
          <div className="order-1 flex shrink-0 items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}brand/cokform-logo.svg`}
              alt="콕폼 · 원하는 대로, 콕 묻고 받아요"
              className="h-12 w-auto"
            />
          </div>

          <div ref={searchPanelRef} className="order-3 relative w-full basis-full sm:order-2 sm:mx-auto sm:max-w-xl sm:flex-1 sm:basis-auto">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#17866D]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              placeholder="폼 이름으로 바로 찾기"
              className="min-h-[44px] w-full rounded-full border border-[#DDE1D9] bg-[#F5F3EC] py-2.5 pl-10 pr-10 text-base text-[#17251F] outline-none transition focus:border-[#17866D] focus:bg-white focus:ring-4 focus:ring-[#D8F5E8] sm:min-h-[0] sm:text-sm"
            />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78837C]"><X size={16} /></button>}
            {searchFocused && query.trim() && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] shadow-[0_12px_30px_rgba(23,37,31,0.16)]">
                {suggestions.length ? suggestions.map((f) => (
                  <button key={f.id} type="button" onClick={() => { onOpenForm(f.id); setQuery(""); setSearchFocused(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#F0FAF6]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF6EF] text-[#17866D]"><ChevronRight size={16} /></div>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[#17251F]">{f.title}</div><div className="mt-0.5 text-xs text-[#78837C]">조회 {f.viewCount || 0} · 응답 {f.responseCount || 0}</div></div>
                    <ExternalLink size={15} className="shrink-0 text-[#A2AAA3]" />
                  </button>
                )) : <div className="px-4 py-4 text-sm text-[#78837C]">비슷한 폼을 찾지 못했어요.</div>}
              </div>
            )}
          </div>

          <div className="order-2 ml-auto flex shrink-0 items-center gap-1.5 sm:order-3">
            <div ref={notificationsPanelRef} className="relative">
              <button onClick={() => { setNotificationsOpen((v) => !v); setSearchFocused(false); }} title="응답 알림" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#59645E] transition hover:bg-[#D8F5E8] hover:text-[#0B4D3D]">
                <Bell size={19} />
                {unreadNotificationCount > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D85B4A] ring-2 ring-[#FFFDF8]" />}
              </button>
              {notificationsOpen && <div className="absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] shadow-[0_12px_30px_rgba(23,37,31,0.16)]"><div className="flex items-center justify-between border-b border-[#F0EEE6] px-4 py-3"><strong className="text-sm text-[#17251F]">응답 알림</strong><span className="text-xs text-[#78837C]">답변 내용은 표시하지 않아요</span></div>{notifications.length ? notifications.map((notification) => <button key={notification.id} type="button" onClick={() => openNotification(notification)} className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#F0FAF6] ${notification.readAt ? "" : "bg-[#F1FAF4]"}`}><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#17251F]">{notification.form.title}</span><span className="mt-0.5 block text-xs text-[#78837C]">새 암호화 응답 도착 · {formatRelative(notification.createdAt)}</span></span><ChevronRight size={15} className="shrink-0 text-[#A2AAA3]" /></button>) : <div className="px-4 py-5 text-sm text-[#78837C]">아직 도착한 응답 알림이 없어요.</div>}</div>}
            </div>
            <button
              onClick={onOpenSettings}
              title="설정"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#59645E] transition hover:bg-[#D8F5E8] hover:text-[#0B4D3D]"
            >
              <Settings size={19} />
            </button>
            <AuthControl user={user} showLogout={false} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-7 sm:px-6 sm:py-10">
        {!authReady ? (
          <div className="mb-6 rounded-2xl border border-[#C9CEC6] bg-[#FFFDF8] px-4 py-3 text-sm text-[#59645E]">로그인 상태를 확인하는 중…</div>
        ) : !user ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#B8C5BA] bg-[#EAF6EF] px-4 py-3 text-sm text-[#355C45]">
            <span><strong>내 폼을 만들려면 Google 로그인</strong>이 필요합니다. 공개 응답 링크는 로그인 없이 열립니다.</span>
            <button onClick={signInWithGoogle} className="rounded-full bg-[#17866D] px-4 py-2 text-xs font-bold text-white hover:bg-[#0F705B]">지금 로그인</button>
          </div>
        ) : null}

        {/* 업무 시작 양식 */}
        <section className="mb-10 border-b border-[#DDE1D9] pb-7 sm:mb-12 sm:pb-9">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.08em] text-[#17866D]">빠르게 시작</p>
              <h1 className="cok-display mb-2">무엇을 만들까요?</h1>
              <p className="max-w-2xl text-sm leading-6 text-[#59645E] sm:text-base">템플릿은 출발점일 뿐이에요. 질문, 순서, 조건, 디자인, 응답 기간을 내 방식으로 바꿔서 쓰세요.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={() => handleCreate(TEMPLATES[0])} disabled={creating !== null} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#17866D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0F705B] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"><Plus size={17} /> 빈 양식으로 시작</button>
              {forms.length > 0 && <button type="button" onClick={handleDuplicateAndOpen} disabled={creating !== null} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#B7DCC8] bg-[#FFFDF8] px-4 py-2.5 text-sm font-semibold text-[#0B4D3D] transition hover:bg-[#EAF6EF] active:scale-[0.97] disabled:cursor-wait disabled:opacity-60"><Copy size={16} /> 내 폼 사본으로 시작</button>}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#59645E]"><span className="rounded-full bg-[#EAF6EF] px-3 py-1.5">질문 유형 직접 선택</span><span className="rounded-full bg-[#EAF6EF] px-3 py-1.5">선택에 따른 질문 표시</span><span className="rounded-full bg-[#EAF6EF] px-3 py-1.5">색상·표지·응답 기간 설정</span></div>
        </section>

        <section className="mb-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold tracking-[0.08em] text-[#17866D]">기본 템플릿</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#17251F] sm:text-2xl">바로 시작할 업무</h2></div>
            <span className="hidden text-xs text-[#78837C] sm:block">자동으로 넘기거나 직접 끌어서 볼 수 있어요</span>
          </div>
          <TemplateCarousel id="quick-templates" templates={TEMPLATES} onCreate={handleCreate} busy={creating !== null} creating={creating} />
        </section>

        <section className="mb-12">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold tracking-[0.08em] text-[#17866D]">업무별 템플릿</p><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#17251F] sm:text-2xl">조금 더 갖춰진 양식</h2></div>
            <span className="hidden text-xs text-[#78837C] sm:block">필요 없는 질문은 바로 지울 수 있어요</span>
          </div>
          <TemplateCarousel id="work-templates" templates={PREMIUM_TEMPLATES} onCreate={handleCreate} busy={creating !== null} creating={creating} />
        </section>

        {!query.trim() && totals.forms > 0 && (
          <section className="mb-12">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div><div className="text-xs font-bold tracking-[0.08em] text-[#17866D]">내 폼</div><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#17251F] sm:text-2xl">지금 운영 중</h2></div>
              <div className="hidden items-center gap-1 text-xs text-[#78837C] sm:flex"><BarChart3 size={14} /> 답변 내용은 포함하지 않음</div>
            </div>
            <div className="grid grid-cols-2 border-y border-[#DDE1D9] sm:grid-cols-4">
              <MetricCard label="만든 폼" value={totals.forms} icon={<BarChart3 size={17} />} />
              <MetricCard label="전체 조회" value={totals.views} suffix="명" icon={<Eye size={17} />} />
              <MetricCard label="전체 응답" value={totals.responses} suffix="건" icon={<CheckCircle2 size={17} />} />
              <MetricCard label="응답 받는 폼" value={totals.active} suffix="개" icon={<ChevronRight size={17} />} />
            </div>
            <div className="mt-3 border-l-2 border-[#A8CABB] bg-[#EFEEE7] px-3 py-2.5 text-xs leading-5 text-[#59645E]">여기에는 조회와 응답 수만 표시됩니다. 답변 내용은 열리지 않습니다.</div>
          </section>
        )}

        {/* recent forms */}
        {!query.trim() && filtered.length > 0 && <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold tracking-[0.08em] text-[#17866D]">최근 작업</div>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#17251F] sm:text-2xl">이어서 작업하기</h2>
              </div>
          <button
            onClick={() => setSortBy((s) => (s === "updated" ? "title" : "updated"))}
            className="flex items-center gap-1.5 rounded-full border border-[#DDE1D9] bg-[#FFFDF8] px-3 py-2 text-xs font-semibold text-[#59645E] transition hover:border-[#17866D] hover:text-[#0B4D3D] sm:text-sm"
          >
            <ArrowUpDown size={14} />
            {sortBy === "updated" ? "최근 수정순" : "이름순"}
          </button>
        </div>}

        {query.trim() && <div className="mb-4 rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] px-4 py-3 text-sm text-[#59645E]">검색창에서 폼을 선택하면 바로 열립니다. <strong className="text-[#17251F]">{filtered.length}개</strong>의 일치 항목이 있어요.</div>}

        {!query.trim() && loading ? (
          <div className="py-16 text-center text-sm text-[#78837C]">불러오는 중…</div>
        ) : !query.trim() && filtered.length === 0 ? (
          <section className="mb-12 flex flex-col items-start gap-4 rounded-2xl border border-[#B7DCC8] bg-[#F0FAF6] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#17866D] text-white"><Plus size={20} /></div>
              <div><h2 className="text-base font-semibold text-[#0B4D3D]">첫 양식을 만들어보세요</h2><p className="mt-1 text-sm leading-6 text-[#355C45]">위의 업무 양식을 고르거나 빈 양식에서 필요한 질문만 직접 추가할 수 있어요.</p></div>
            </div>
            <button type="button" onClick={() => handleCreate(TEMPLATES[0])} disabled={creating !== null} className="shrink-0 rounded-xl bg-[#0F5B46] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B4D3D] disabled:cursor-wait disabled:opacity-60">빈 양식으로 시작</button>
          </section>
        ) : !query.trim() ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {filtered.map((f) => (
              <div
                key={f.id}
                className="group relative border-t-2 border-[#B8C5BA] bg-transparent transition-colors duration-150 hover:border-[#17866D]"
              >
                <button onClick={() => onOpenForm(f.id)} className="block w-full text-left">
                  <div className="h-[112px] overflow-hidden rounded-[10px] border border-[#DDE1D9] bg-[#F5F3EC] sm:h-[128px]">
                    {sanitizeImageSource(f.coverImage?.src)
                      ? <img src={sanitizeImageSource(f.coverImage.src)} alt="" className="h-full w-full object-cover" />
                      : <FormThumbnail questions={f.questions || []} />}
                  </div>
                  <div className="px-0 pb-2 pt-3">
                    <div className="truncate text-sm font-semibold text-[#17251F]">{f.title}</div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-[#78837C]"><span className={`inline-flex items-center gap-1 ${formResponseState(f) === "open" ? "text-[#17866D]" : "text-[#B3261E]"}`}><span className={`h-1.5 w-1.5 rounded-full ${formResponseState(f) === "open" ? "bg-[#17866D]" : "bg-[#B3261E]"}`} />{formResponseLabel(f)}</span><span>조회 {f.viewCount || 0}</span><span>응답 {f.responseCount || 0}</span></div>
                    <div className="mt-1 text-xs text-[#78837C]">마지막으로 {formatRelative(f.updatedAt)} 손봤어요</div>
                  </div>
                </button>

                <button
                  onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                  aria-label={`${f.title} 메뉴 열기`}
                  className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFFDF8]/95 text-[#59645E] opacity-100 shadow-sm transition hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
                >
                  <MoreVertical size={16} />
                </button>

                {openMenuId === f.id && (
                  <div className="absolute right-1.5 top-10 z-10 w-40 overflow-hidden rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] py-1 text-sm shadow-lg">
                    <button
                      onClick={() => onOpenForm(f.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#17251F] hover:bg-[#D8F5E8]"
                    >
                      <ExternalLink size={14} /> 열기
                    </button>
                    <button
                      onClick={() => handleDuplicate(f.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#17251F] hover:bg-[#D8F5E8]"
                    >
                      <Copy size={14} /> 사본 만들기
                    </button>
                    <button
                      onClick={() => requestDelete(f.id, f.title)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#B3261E] hover:bg-[#F9DEDC]/60"
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}

        {!query.trim() && !loading && participatedForms.length > 0 && (
          <section className="mt-12 border-t border-[#DDE1D9] pt-9">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div className="text-xs font-bold tracking-[0.08em] text-[#17866D]">참여한 양식</div>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#17251F] sm:text-2xl">내가 참여한 폼</h2>
              </div>
              <span className="hidden text-xs text-[#78837C] sm:block">응답 원문은 저장하지 않아요</span>
            </div>
            <p className="mb-4 max-w-2xl text-xs leading-5 text-[#59645E]">제출을 완료한 폼의 제목·문항 수·참여 시각만 이 기기에 기록됩니다. 로그인 상태에서는 같은 계정으로 이력만 동기화되며, 응답 내용과 암호화 키는 포함되지 않습니다.</p>
            {participatedForms.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#B8C5BA] bg-[#FFFDF8]/70 px-5 py-9 text-sm text-[#59645E]">아직 참여한 폼이 없어요. 공개 링크에서 응답을 제출하면 여기에 표시됩니다.</div>
            ) : (
              <div className="divide-y divide-[#DDE1D9] border-y border-[#DDE1D9]">
                {participatedForms.map((form) => (
                  <button key={form.id} type="button" onClick={() => openParticipatedForm(form.id)} className="group flex w-full items-start gap-3 px-1 py-4 text-left transition-colors hover:bg-[#EFEEE7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17866D]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF6EF] text-[#17866D]"><CheckCircle2 size={16} /></div>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold text-[#17251F]">{form.title}</div><div className="mt-1 text-xs text-[#78837C]">문항 {form.questionCount || 0}개 · {formatRelative(form.lastParticipatedAt)} 참여</div></div>
                    <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#0B4D3D]">다시 보기 <ChevronRight size={14} /></span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {notice && (
        <div role="status" className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2.5 text-sm text-white shadow-lg ${notice.startsWith("삭제하지") ? "bg-[#B3261E]" : "bg-[#17251F]"}`}>
          {notice}
        </div>
      )}

      {deleteTarget && (
        <Modal title="폼 삭제" onClose={() => !deleting && setDeleteTarget(null)}>
          <p className="text-sm leading-6 text-[#59645E]"><strong className="text-[#17251F]">“{deleteTarget.title}”</strong>을 삭제합니다. 폼과 연결된 암호화 응답도 함께 삭제되며, 이 작업은 복원할 수 없습니다.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="rounded-full border border-[#C9CEC6] bg-white px-4 py-2 text-sm font-semibold text-[#59645E] transition-colors hover:bg-[#F5F3EC] disabled:opacity-50">취소</button>
            <button type="button" onClick={confirmDelete} disabled={deleting} className="rounded-full bg-[#B3261E] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#8C1D18] disabled:cursor-wait disabled:opacity-60">{deleting ? "삭제 중…" : "삭제"}</button>
          </div>
        </Modal>
      )}

      <footer className="mt-14 border-t border-[#DDE1D9] bg-[#101713] text-[#D6E1D8]">
        <div className="mx-auto max-w-6xl px-5 py-9 sm:px-6 sm:py-10">
          <div className="grid gap-8 sm:grid-cols-[1.25fr_0.8fr_0.9fr]">
            <div>
              <a href="/" className="inline-flex items-center gap-2.5 text-white"><img src="/brand/cokform-mark.svg" alt="" className="h-9 w-9" /><span className="text-lg font-extrabold tracking-[-0.04em]">콕폼</span></a>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#9DAAA1]">필요한 내용을 묻고, 내 방식으로 받아보세요. 응답 원문은 작성자만 읽도록 설계했습니다.</p>
              <a href="mailto:seoharo0111@gmail.com" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#D6E1D8] transition hover:text-[#D8ED59]"><Mail size={15} /> 문의하기</a>
            </div>

            <nav aria-label="서비스 링크">
              <h2 className="text-xs font-bold tracking-[0.08em] text-[#718077]">서비스</h2>
              <div className="mt-3 flex flex-col items-start gap-2.5 text-sm">
                <a href="/" className="transition hover:text-[#D8ED59]">폼 만들기</a>
                <a href="/docs" className="transition hover:text-[#D8ED59]">사용 가이드</a>
                <a href="/security" className="transition hover:text-[#D8ED59]">응답 암호화</a>
                <a href="/resources" className="transition hover:text-[#D8ED59]">브랜드 리소스</a>
                <a href="/faq" className="transition hover:text-[#D8ED59]">자주 묻는 질문</a>
              </div>
            </nav>

            <nav aria-label="정책 링크">
              <h2 className="text-xs font-bold tracking-[0.08em] text-[#718077]">정책</h2>
              <div className="mt-3 flex flex-col items-start gap-2.5 text-sm">
                <a href="/privacy" className="transition hover:text-[#D8ED59]">개인정보처리방침</a>
                <a href="/international-transfer" className="transition hover:text-[#D8ED59]">개인정보 국외이전 안내</a>
                <a href="/service-restrictions" className="transition hover:text-[#D8ED59]">서비스 이용제한 정책</a>
                <a href="/terms" className="transition hover:text-[#D8ED59]">이용약관</a>
                <a href="/business-info" className="transition hover:text-[#D8ED59]">사업자 안내</a>
                <a href="/sitemap" className="transition hover:text-[#D8ED59]">사이트맵</a>
              </div>
            </nav>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-5 text-[11px] leading-5 text-[#718077] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Cokform. All rights reserved.</p>
            <p>원하는 대로, 콕 묻고 받아요.</p>
          </div>
        </div>
      </footer>

      {/* click-away layer for the open card menu */}
      {openMenuId && <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}

function matchScore(title = "", keyword = "") {
  const value = title.toLowerCase();
  const tokens = keyword.split(/\s+/).filter(Boolean);
  if (!tokens.length) return 0;
  return tokens.reduce((score, token) => score + (value === token ? 100 : value.startsWith(token) ? 70 : value.includes(token) ? 35 : 0), 0);
}

function MetricCard({ label, value, suffix = "", icon }) {
  return <div className="border-l border-[#DDE1D9] px-3 py-4 first:border-l-0 sm:px-4"><div className="flex items-center justify-between gap-2 text-[#17866D]"><span className="text-xs font-semibold text-[#78837C]">{label}</span>{icon}</div><div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[#17251F]">{value.toLocaleString("ko-KR")}<span className="ml-1 text-xs font-medium text-[#78837C]">{suffix}</span></div></div>;
}

function TemplateCarousel({ id, templates, onCreate, busy, creating }) {
  const railRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const updateActiveIndex = () => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = [...rail.querySelectorAll("[data-template-card]")];
    if (!cards.length) return;
    const railCenter = rail.scrollLeft + rail.clientWidth / 2;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const nextDistance = Math.abs(cardCenter - railCenter);
      if (nextDistance < distance) {
        distance = nextDistance;
        nearest = index;
      }
    });
    setActiveIndex(nearest);
  };

  const moveByCard = (direction) => {
    const rail = railRef.current;
    const card = rail?.querySelector("[data-template-card]");
    if (!rail || !card) return;
    rail.scrollBy({ left: direction * (card.offsetWidth + 16), behavior: "smooth" });
  };

  const moveToCard = (index) => {
    const rail = railRef.current;
    const cards = rail?.querySelectorAll("[data-template-card]");
    const card = cards?.[index];
    if (!rail || !card) return;
    rail.scrollTo({ left: Math.max(0, card.offsetLeft - 8), behavior: "smooth" });
  };

  useEffect(() => {
    if (!autoPlay || templates.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      const rail = railRef.current;
      const cards = rail?.querySelectorAll("[data-template-card]");
      if (!rail || !cards?.length) return;
      const nextIndex = activeIndex >= cards.length - 1 ? 0 : activeIndex + 1;
      rail.scrollTo({ left: nextIndex === 0 ? 0 : Math.max(0, cards[nextIndex].offsetLeft - 8), behavior: "smooth" });
    }, 4200);
    return () => window.clearInterval(timer);
  }, [activeIndex, autoPlay, templates.length]);

  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2" aria-label={`템플릿 ${activeIndex + 1} / ${templates.length}`}>
          <span className="font-mono text-xs font-semibold text-[#0B4D3D]">{String(activeIndex + 1).padStart(2, "0")} / {String(templates.length).padStart(2, "0")}</span>
          <div className="flex gap-1.5" aria-hidden="true">
            {templates.map((template, index) => <span key={template.key} className={`h-1.5 rounded-full transition-all duration-200 ${index === activeIndex ? "w-5 bg-[#17866D]" : "w-1.5 bg-[#C9CEC6]"}`} />)}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setAutoPlay((value) => !value)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#DDE1D9] bg-[#FFFDF8] px-3 text-xs font-semibold text-[#59645E] transition hover:border-[#17866D] hover:text-[#0B4D3D]" aria-label={autoPlay ? "자동 넘김 멈추기" : "자동 넘김 시작하기"}>{autoPlay ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}<span className="hidden sm:inline">{autoPlay ? "자동 넘김" : "자동 멈춤"}</span></button>
          <button type="button" onClick={() => moveByCard(-1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DDE1D9] bg-[#FFFDF8] text-[#355C45] transition hover:border-[#17866D] hover:bg-[#EAF6EF] active:scale-[0.97]" aria-label="이전 템플릿"><ChevronLeft size={18} /></button>
          <button type="button" onClick={() => moveByCard(1)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DDE1D9] bg-[#FFFDF8] text-[#355C45] transition hover:border-[#17866D] hover:bg-[#EAF6EF] active:scale-[0.97]" aria-label="다음 템플릿"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="relative">
        <div
          id={id}
          ref={railRef}
          onScroll={() => {
            if (scrollFrameRef.current) window.cancelAnimationFrame(scrollFrameRef.current);
            scrollFrameRef.current = window.requestAnimationFrame(updateActiveIndex);
          }}
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth border-y border-[#DDE1D9] pb-0 pr-10 [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="템플릿 목록"
        >
          {templates.map((template) => <TemplateCard key={template.key} template={template} onCreate={onCreate} busy={busy} creating={creating === template.key} />)}
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#F5F3EC] to-transparent" />
      </div>
      <div className="mt-1 flex items-center justify-between gap-3 sm:hidden"><span className="text-xs text-[#78837C]">카드를 끌거나 버튼으로 넘겨 보세요</span><button type="button" onClick={() => moveToCard((activeIndex + 1) % templates.length)} className="text-xs font-semibold text-[#0B4D3D]">다음 보기</button></div>
    </div>
  );
}

function TemplateCard({ template: t, onCreate, busy, creating }) {
  // 카드 렌더링에 필요한 정보만 만든다. 실제 생성 시에도 handleCreate에서 새 폼을 별도로 만든다.
  const accent = templateAccent(t.key);
  const previewQuestions = t.blank ? [] : (t.build()?.questions || []);
  const questionCount = previewQuestions.filter((question) => !["section", "privacy_notice"].includes(question.type)).length;
  const hasPrivacyGuide = previewQuestions.some((question) => ["privacy_notice", "privacy_consent"].includes(question.type));

  return (
    <button
      onClick={() => onCreate(t)}
      disabled={busy}
      data-template-card
      className={`group relative flex min-h-[142px] w-[min(70vw,214px)] shrink-0 snap-start flex-col justify-between border-r border-t-2 border-[#DDE1D9] p-4 text-left transition-[background-color,border-color] duration-150 hover:bg-[#FFFDF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17866D] sm:w-[210px] ${
        t.blank ? "border-l border-l-[#DDE1D9] bg-[#EAF6EF]" : "bg-transparent"
      } ${creating ? "opacity-60" : ""}`}
      style={{ borderTopColor: t.blank ? MD.primary : accent }}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-[15px] font-semibold leading-5 tracking-[-0.02em] text-[#17251F]">{t.label}</span>
          {t.blank ? <Plus size={21} strokeWidth={2.3} className="shrink-0" style={{ color: MD.primary }} /> : <ChevronRight size={18} className="mt-0.5 shrink-0 text-[#17866D] transition-transform group-hover:translate-x-0.5" />}
        </div>
        {t.segment && <p className="mt-2 text-xs leading-5 text-[#59645E]">{t.segment}</p>}
        {!t.blank && <span className="mt-4 inline-flex w-fit border-b border-[#DDE1D9] pb-1 text-[11px] font-semibold text-[#59645E] transition-colors group-hover:border-[#17866D] group-hover:text-[#0B4D3D]">열어서 바꾸기</span>}
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-[#78837C]">
        {t.blank ? <span>처음부터 구성</span> : <><span>문항 {questionCount}개</span>{hasPrivacyGuide && <><span className="text-[#B8C5BA]">·</span><span>개인정보 안내</span></>}</>}
      </div>
    </button>
  );
}

function templateAccent(key) {
  const accents = {
    consultation_request: "#4E7BB7",
    reservation_request: "#8B6B35",
    program_application: "#17866D",
    attendance_check: "#4F9A70",
    quote_request: "#D25561",
    job_application: "#7B6FD0",
    customer_satisfaction: "#E18B35",
    privacy_agreement: "#17866D",
    education_feedback: "#4E7BB7",
    internal_feedback: "#D25561",
    group_order: "#8B6B35",
  };
  return accents[key] || "#17866D";
}
