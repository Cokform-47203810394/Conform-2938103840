import { useEffect, useMemo, useState } from "react";
import { Search, Settings, Plus, MoreVertical, Copy, Trash2, ExternalLink, ArrowUpDown } from "lucide-react";
import FormThumbnail from "../components/FormThumbnail";
import { TEMPLATES, PREMIUM_TEMPLATES } from "../templates";
import { listForms, saveFormDoc, deleteFormDoc, duplicateFormDoc, newFormId } from "../lib/formsStore";
import { BRAND, MD, TYPE_COLORS, ELEV1, ELEV1_HOVER } from "../theme";

function formatRelative(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return "오늘";
  if (diffMs < 2 * day) return "어제";
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export default function HomePage({ onOpenForm, onOpenSettings }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("updated"); // 'updated' | 'title'
  const [openMenuId, setOpenMenuId] = useState(null);
  const [creating, setCreating] = useState(null);

  const refresh = async () => {
    setLoading(true);
    const list = await listForms();
    setForms(list);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

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

  const handleCreate = async (template) => {
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

  const handleDelete = async (id, title) => {
    setOpenMenuId(null);
    if (!window.confirm(`"${title}" 설문지를 삭제할까요? 응답 데이터도 함께 삭제됩니다.`)) return;
    await deleteFormDoc(id);
    refresh();
  };

  return (
    <div className="min-h-screen bg-[#F5F3EC]">
      {/* top bar */}
      <div className="sticky top-0 z-10 border-b border-[#DDE1D9] bg-[#FFFDF8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-3 sm:px-6">
          <div className="flex shrink-0 items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}brand/cokform-logo.svg`}
              alt="콕폼 · ASK IT WELL"
              className="h-10 w-auto"
            />
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#17866D]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="내 폼을 찾아볼까요?"
              className="w-full rounded-full border border-[#DDE1D9] bg-[#F5F3EC] py-2.5 pl-10 pr-4 text-base text-[#17251F] outline-none transition focus:border-[#17866D] focus:bg-white focus:ring-4 focus:ring-[#D8F5E8] sm:text-sm"
            />
          </div>

          <button
            onClick={onOpenSettings}
            title="설정"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#59645E] transition hover:bg-[#D8F5E8] hover:text-[#0B4D3D]"
          >
            <Settings size={19} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 py-8 sm:px-6 sm:py-10">
        {/* templates */}
        <div className="mb-2 cok-eyebrow">START WITH A SIGNAL</div>
        <h1 className="cok-display mb-2">무엇을 물어볼까요?</h1>
        <p className="mb-6 max-w-xl text-sm leading-6 text-[#59645E] sm:text-base">목적에 맞는 시작점을 고르고, 사람들의 답이 자연스럽게 모이는 폼을 만들어보세요.</p>
        <div className="mb-12 flex gap-4 overflow-x-auto pb-2 sm:gap-5">
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.key} template={t} onCreate={handleCreate} busy={creating !== null} creating={creating === t.key} />
          ))}
        </div>

        {/* premium / institutional templates */}
        <div className="mb-2 flex items-center gap-2">
          <div className="cok-eyebrow">READY-MADE FLOWS</div>
          <span className="rounded-full bg-[#D8ED59] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#17251F]">PRO</span>
        </div>
        <p className="mb-4 text-sm text-[#59645E]">신청·동의·피드백처럼 자주 쓰는 흐름을 바로 시작해요.</p>
        <div className="mb-12 flex gap-4 overflow-x-auto pb-2 sm:gap-5">
          {PREMIUM_TEMPLATES.map((t) => (
            <TemplateCard key={t.key} template={t} onCreate={handleCreate} busy={creating !== null} creating={creating === t.key} premium />
          ))}
        </div>

        {/* recent forms */}
        <div className="mb-3 flex items-center justify-between">
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
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#78837C]">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#B8C5BA] bg-[#FFFDF8]/70 py-16 text-center text-sm text-[#59645E]">
            {query ? "찾는 폼이 없어요." : "아직 만든 폼이 없어요. 위에서 하나를 골라 시작해보세요."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {filtered.map((f) => (
              <div
                key={f.id}
                className={`group relative overflow-hidden rounded-[18px] border border-[#DDE1D9] bg-[#FFFDF8] transition-all ${ELEV1_HOVER}`}
              >
                <button onClick={() => onOpenForm(f.id)} className="block w-full text-left">
                  <div className="h-[112px] border-b border-[#DDE1D9] bg-[#F5F3EC] sm:h-[128px]">
                    <FormThumbnail questions={f.questions || []} />
                  </div>
                  <div className="px-3 pb-2.5 pt-2.5">
                    <div className="truncate text-sm font-semibold text-[#17251F]">{f.title}</div>
                    <div className="mt-1 text-xs text-[#78837C]">마지막으로 {formatRelative(f.updatedAt)} 손봤어요</div>
                  </div>
                </button>

                <button
                  onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                  className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFFDF8]/95 text-[#59645E] opacity-0 shadow-sm transition hover:bg-white group-hover:opacity-100"
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
                      onClick={() => handleDelete(f.id, f.title)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#B3261E] hover:bg-[#F9DEDC]/60"
                    >
                      <Trash2 size={14} /> 삭제
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-[#DDE1D9] pt-5 text-xs text-[#78837C]">
        <span>Private Pilot · 응답은 브라우저에서 암호화됩니다.</span>
        <a href="?privacy=1" className="font-medium text-[#59645E] underline underline-offset-2">개인정보 안내</a>
      </footer>

      {/* click-away layer for the open card menu */}
      {openMenuId && <div className="fixed inset-0 z-0" onClick={() => setOpenMenuId(null)} />}
    </div>
  );
}

function TemplateCard({ template: t, onCreate, busy, creating, premium }) {
  return (
    <button
      onClick={() => onCreate(t)}
      disabled={busy}
      className={`group relative w-[132px] shrink-0 overflow-hidden rounded-lg bg-white text-left transition-all sm:w-[148px] ${ELEV1_HOVER} ${
        creating ? "opacity-60" : ""
      }`}
    >
      {premium && (
        <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-[#D8ED59] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#17251F]">
          PRO
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
