import { useEffect, useMemo, useState } from "react";
import { Search, Settings, Plus, MoreVertical, Copy, Trash2, ExternalLink, ArrowUpDown, Bell, Eye, BarChart3, CheckCircle2, ChevronRight, X, Github, Mail, ShieldCheck, FileText, Map } from "lucide-react";
import AuthControl from "../components/AuthControl";
import { signInWithGoogle } from "../lib/auth";
import FormThumbnail from "../components/FormThumbnail";
import { Modal } from "../components/Overlay";
import { TEMPLATES, PREMIUM_TEMPLATES } from "../templates";
import { listForms, listParticipatedForms, saveFormDoc, deleteFormDoc, duplicateFormDoc, newFormId } from "../lib/formsStore";
import { BRAND, MD, TYPE_COLORS, ELEV1, ELEV1_HOVER } from "../theme";
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
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("updated"); // 'updated' | 'title'
  const [openMenuId, setOpenMenuId] = useState(null);
  const [creating, setCreating] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const [created, participated] = await Promise.all([listForms(), listParticipatedForms()]);
    setForms(created);
    setParticipatedForms(participated);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [user?.id]);

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

  const notifications = useMemo(() => forms
    .filter((f) => f.ownerResponseNotification !== false && (f.responseCount || 0) > 0)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5), [forms]);

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
              alt="콕폼 · ASK IT WELL"
              className="h-10 w-auto"
            />
          </div>

          <div className="order-3 relative w-full basis-full sm:order-2 sm:mx-auto sm:max-w-xl sm:flex-1 sm:basis-auto">
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
            <div className="relative">
              <button onClick={() => setNotificationsOpen((v) => !v)} title="응답 알림" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#59645E] transition hover:bg-[#D8F5E8] hover:text-[#0B4D3D]">
                <Bell size={19} />
                {notifications.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#D85B4A] ring-2 ring-[#FFFDF8]" />}
              </button>
              {notificationsOpen && <div className="absolute right-0 top-12 z-30 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] shadow-[0_12px_30px_rgba(23,37,31,0.16)]"><div className="flex items-center justify-between border-b border-[#F0EEE6] px-4 py-3"><strong className="text-sm text-[#17251F]">응답 알림</strong><span className="text-xs text-[#78837C]">최근 업데이트 기준</span></div>{notifications.length ? notifications.map((f) => <button key={f.id} type="button" onClick={() => onOpenForm(f.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#F0FAF6]"><span className="min-w-0"><span className="block truncate text-sm font-semibold text-[#17251F]">{f.title}</span><span className="mt-0.5 block text-xs text-[#78837C]">새 응답 {f.responseCount}건 · 조회 {f.viewCount || 0}명</span></span><ChevronRight size={15} className="shrink-0 text-[#A2AAA3]" /></button>) : <div className="px-4 py-5 text-sm text-[#78837C]">아직 도착한 응답이 없어요.</div>}</div>}
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

        {/* templates */}
        <div className="mb-2 cok-eyebrow">START WITH A SIGNAL</div>
        <h1 className="cok-display mb-2">무엇을 물어볼까요?</h1>
        <p className="mb-6 max-w-xl text-sm leading-6 text-[#59645E] sm:text-base">목적에 맞는 시작점을 고르고, 사람들의 답이 자연스럽게 모이는 폼을 만들어보세요.</p>
        <div className="mb-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-3 [-webkit-overflow-scrolling:touch] sm:gap-5">
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.key} template={t} onCreate={handleCreate} busy={creating !== null} creating={creating === t.key} />
          ))}
        </div>

        {/* premium / institutional templates */}
        <div className="mb-2 flex items-center gap-2">
          <div className="cok-eyebrow">READY-MADE FLOWS</div>
          <span className="rounded-full bg-[#D8ED59] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#17251F]">PRO · 무료 공개 중</span>
        </div>
        <p className="mb-4 text-sm leading-6 text-[#59645E]">신청·동의·피드백처럼 자주 쓰는 흐름을 바로 시작해요. <strong className="font-semibold text-[#0B4D3D]">파일럿 기간에는 PRO 템플릿을 몇 달간 무료로 공개합니다.</strong> 유료 전환 전에는 이 페이지에서 미리 안내해요.</p>
        <div className="mb-12 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 pr-3 [-webkit-overflow-scrolling:touch] sm:gap-5">
          {PREMIUM_TEMPLATES.map((t) => (
            <TemplateCard key={t.key} template={t} onCreate={handleCreate} busy={creating !== null} creating={creating === t.key} premium />
          ))}
        </div>

        {!query.trim() && (
          <section className="mb-12">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div><div className="cok-eyebrow">LIVE OPERATIONS</div><h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#17251F] sm:text-2xl">폼 운영 현황</h2></div>
              <div className="hidden items-center gap-1 text-xs text-[#78837C] sm:flex"><BarChart3 size={14} /> 개인정보 없이 집계</div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard label="만든 폼" value={totals.forms} icon={<BarChart3 size={17} />} />
              <MetricCard label="전체 조회" value={totals.views} suffix="명" icon={<Eye size={17} />} />
              <MetricCard label="전체 응답" value={totals.responses} suffix="건" icon={<CheckCircle2 size={17} />} />
              <MetricCard label="응답 받는 폼" value={totals.active} suffix="개" icon={<ChevronRight size={17} />} />
            </div>
            <div className="mt-3 rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] px-4 py-3 text-xs leading-5 text-[#59645E]">응답 내용은 암호화되어 저장되고, 이 화면에는 폼별 조회·응답 건수만 표시됩니다. 조회 수는 같은 브라우저의 중복 방문을 한 번으로 계산합니다.</div>
          </section>
        )}

        {/* recent forms */}
        {!query.trim() && <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="cok-eyebrow">YOUR WORKBENCH</div>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#17251F] sm:text-2xl">내가 만든 폼</h2>
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
          <div className="rounded-[24px] border border-dashed border-[#B8C5BA] bg-[#FFFDF8]/70 py-16 text-center text-sm text-[#59645E]">
            {query ? "찾는 폼이 없어요." : "아직 만든 폼이 없어요. 위에서 하나를 골라 시작해보세요."}
          </div>
        ) : !query.trim() ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {filtered.map((f) => (
              <div
                key={f.id}
                className={`group relative overflow-hidden rounded-[18px] border border-[#DDE1D9] bg-[#FFFDF8] transition-all ${ELEV1_HOVER}`}
              >
                <button onClick={() => onOpenForm(f.id)} className="block w-full text-left">
                  <div className="h-[112px] overflow-hidden border-b border-[#DDE1D9] bg-[#F5F3EC] sm:h-[128px]">
                    {sanitizeImageSource(f.coverImage?.src)
                      ? <img src={sanitizeImageSource(f.coverImage.src)} alt="" className="h-full w-full object-cover" />
                      : <FormThumbnail questions={f.questions || []} />}
                  </div>
                  <div className="px-3 pb-2.5 pt-2.5">
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

        {!query.trim() && !loading && (
          <section className="mt-12 border-t border-[#DDE1D9] pt-9">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <div className="cok-eyebrow">PARTICIPATION HISTORY</div>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#17251F] sm:text-2xl">내가 참여한 폼</h2>
              </div>
              <span className="hidden text-xs text-[#78837C] sm:block">응답 원문은 저장하지 않아요</span>
            </div>
            <p className="mb-4 max-w-2xl text-xs leading-5 text-[#59645E]">제출을 완료한 폼의 제목·문항 수·참여 시각만 이 기기에 기록됩니다. 로그인 상태에서는 같은 계정으로 이력만 동기화되며, 응답 내용과 암호화 키는 포함되지 않습니다.</p>
            {participatedForms.length === 0 ? (
              <div className="rounded-[20px] border border-dashed border-[#B8C5BA] bg-[#FFFDF8]/70 px-5 py-9 text-sm text-[#59645E]">아직 참여한 폼이 없어요. 공개 링크에서 응답을 제출하면 여기에 표시됩니다.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {participatedForms.map((form) => (
                  <button key={form.id} type="button" onClick={() => openParticipatedForm(form.id)} className={`group rounded-[18px] border border-[#DDE1D9] bg-[#FFFDF8] p-4 text-left transition ${ELEV1_HOVER}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF6EF] text-[#17866D]"><CheckCircle2 size={18} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[#17251F]">{form.title}</div>
                        <div className="mt-1 text-xs text-[#78837C]">문항 {form.questionCount || 0}개 · {formatRelative(form.lastParticipatedAt)} 참여</div>
                        <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D3D]">공개 폼 다시 보기 <ChevronRight size={14} /></div>
                      </div>
                    </div>
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

      <footer className="mt-14 bg-[#101713] text-[#D6E1D8]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-12">
          <div className="grid gap-10 border-t border-white/10 pt-8 lg:grid-cols-[1.45fr_0.8fr_0.9fr] lg:gap-12">
            <div>
              <a href="/" className="inline-flex items-center gap-2.5 text-white"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D8ED59] text-xs font-black tracking-[-0.06em] text-[#17251F]">C</span><span className="text-lg font-extrabold tracking-[-0.04em]">COKFORM</span></a>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#9DAAA1]">한국 실무 흐름에 맞춘 개인정보 보호형 폼 빌더. 응답은 브라우저에서 암호화되어, 폼 작성자만 자신의 키로 읽도록 설계합니다.</p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-[0.08em]">
                <a href="https://github.com/haroseo" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[#D6E1D8] transition hover:text-[#D8ED59]"><Github size={16} /> GitHub <ExternalLink size={12} /></a>
                <a href="mailto:seoharo0111@gmail.com" className="inline-flex items-center gap-2 text-[#D6E1D8] transition hover:text-[#D8ED59]"><Mail size={16} /> 문의하기</a>
              </div>
            </div>

            <nav aria-label="서비스 링크">
              <h2 className="text-xs font-bold tracking-[0.12em] text-[#718077]">서비스</h2>
              <div className="mt-4 flex flex-col items-start gap-3 text-sm">
                <a href="/" className="transition hover:text-[#D8ED59]">폼 만들기</a>
                <a href="/security" className="transition hover:text-[#D8ED59]">보안과 응답 암호화</a>
                <a href="/faq" className="transition hover:text-[#D8ED59]">자주 묻는 질문</a>
                <a href="/sitemap" className="inline-flex items-center gap-1 transition hover:text-[#D8ED59]">사이트맵 <Map size={14} /></a>
              </div>
            </nav>

            <nav aria-label="정책과 운영 링크">
              <h2 className="text-xs font-bold tracking-[0.12em] text-[#718077]">정책 · 운영</h2>
              <div className="mt-4 flex flex-col items-start gap-3 text-sm">
                <a href="/privacy" className="inline-flex items-center gap-1 transition hover:text-[#D8ED59]">개인정보처리방침 <ShieldCheck size={14} /></a>
                <a href="/terms" className="inline-flex items-center gap-1 transition hover:text-[#D8ED59]">이용약관 <FileText size={14} /></a>
                <a href="/sitemap.xml" className="transition hover:text-[#D8ED59]">검색엔진용 XML 사이트맵</a>
                <a href="mailto:seoharo0111@gmail.com" className="text-xs leading-5 text-[#9DAAA1] transition hover:text-[#D8ED59]">문의: seoharo0111@gmail.com</a>
              </div>
            </nav>
          </div>

          <details className="group mt-9 border-y border-white/10 py-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[#D6E1D8] [&::-webkit-details-marker]:hidden"><span className="inline-flex items-center gap-2">오픈소스 라이선스와 고지 <ChevronRight size={15} className="transition group-open:rotate-90" /></span></summary>
            <div className="mt-4 max-w-4xl text-xs leading-6 text-[#9DAAA1]">콕폼은 React, React DOM, Supabase JavaScript, Lucide, Vite, Tailwind CSS 등 오픈소스 소프트웨어를 사용합니다. 각 소프트웨어의 저작권 및 라이선스는 해당 프로젝트의 원본 저장소와 배포물에 따릅니다. <a href="https://github.com/facebook/react" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#D8ED59]">React</a> · <a href="https://github.com/supabase/supabase-js" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#D8ED59]">Supabase JS</a> · <a href="https://github.com/lucide-icons/lucide" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#D8ED59]">Lucide</a> · <a href="https://github.com/vitejs/vite" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#D8ED59]">Vite</a> · <a href="https://github.com/tailwindlabs/tailwindcss" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-[#D8ED59]">Tailwind CSS</a></div>
          </details>

          <div className="flex flex-col gap-3 pt-6 text-[11px] leading-5 text-[#718077] sm:flex-row sm:items-start sm:justify-between">
            <div><p>© 2026 Cokform. All rights reserved.</p><p className="mt-1 max-w-3xl">응답 원문은 암호화되어 저장되도록 설계됩니다. 개인정보 수집의 목적·항목·보관기간과 응답자 권리 고지는 각 폼 운영자가 실제 운영 내용에 맞게 설정해야 합니다.</p></div>
            <p className="shrink-0 font-medium text-[#9DAAA1]">ASK IT WELL.</p>
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
  return <div className="rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-4 shadow-[0_2px_8px_rgba(23,37,31,0.06)]"><div className="mb-3 flex items-center justify-between text-[#17866D]"><span className="text-xs font-semibold text-[#78837C]">{label}</span>{icon}</div><div className="text-2xl font-semibold tracking-[-0.04em] text-[#17251F]">{value.toLocaleString("ko-KR")}<span className="ml-1 text-xs font-medium text-[#78837C]">{suffix}</span></div></div>;
}

function TemplateCard({ template: t, onCreate, busy, creating, premium }) {
  return (
    <button
      onClick={() => onCreate(t)}
      disabled={busy}
      className={`group relative w-[min(40vw,148px)] shrink-0 snap-start overflow-hidden rounded-lg bg-white text-left transition-all sm:w-[148px] ${ELEV1_HOVER} ${
        creating ? "opacity-60" : ""
      }`}
    >
      {premium && (
        <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-[#D8ED59] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#17251F]">
          무료
        </span>
      )}
      <div className="flex h-[104px] items-center justify-center border-b border-[#DDE1D9] bg-[#F5F3EC] sm:h-[118px]">
        {t.blank ? (
          <span className="relative flex h-9 w-9 items-center justify-center">
            <Plus size={34} strokeWidth={2.5} style={{ color: MD.primary }} />
          </span>
        ) : (
          <FormThumbnail questions={t.build().questions} accent={TYPE_COLORS[t.key === "contact" ? "short" : "radio"]} />
        )}
      </div>
      <div className="px-3 py-3 text-sm font-semibold text-[#17251F]">{t.label}</div>
    </button>
  );
}
