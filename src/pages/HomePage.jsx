import { useEffect, useMemo, useState } from "react";
import { Search, Settings, Plus, MoreVertical, Copy, Trash2, ExternalLink, ArrowUpDown } from "lucide-react";
import FormThumbnail from "../components/FormThumbnail";
import { TEMPLATES, PREMIUM_TEMPLATES } from "../templates";
import { listForms, saveFormDoc, deleteFormDoc, duplicateFormDoc, newFormId } from "../lib/formsStore";
import { MD, TYPE_COLORS, ELEV1, ELEV1_HOVER } from "../theme";

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
    <div className="min-h-screen bg-[#F1F3F4]">
      {/* top bar */}
      <div className="sticky top-0 z-10 border-b border-[#E0E0E0] bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-6">
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
              style={{ background: `linear-gradient(135deg, ${MD.primary}, ${TYPE_COLORS.checkbox})` }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="2" fill="white" fillOpacity="0.95" />
                <rect x="13" y="3" width="8" height="8" rx="2" fill="white" fillOpacity="0.7" />
                <rect x="3" y="13" width="8" height="8" rx="2" fill="white" fillOpacity="0.7" />
                <rect x="13" y="13" width="8" height="8" rx="2" fill="white" fillOpacity="0.95" />
              </svg>
            </span>
            <span className="hidden text-lg text-[#1C1B1F] sm:inline">콕폼</span>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6368]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="내 설문지 검색"
              className="w-full rounded-full border-none bg-[#E8EAED] py-2.5 pl-10 pr-4 text-base text-[#1C1B1F] outline-none focus:bg-white focus:shadow-[0_1px_1px_rgba(0,0,0,0.1),0_1px_3px_1px_rgba(0,0,0,0.08)] sm:text-sm"
            />
          </div>

          <button
            onClick={onOpenSettings}
            title="설정"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#49454F] hover:bg-[#1C1B1F]/[0.06]"
          >
            <Settings size={19} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6">
        {/* templates */}
        <h2 className="mb-3 text-base font-medium text-[#1C1B1F] sm:text-lg">새 양식 시작하기</h2>
        <div className="mb-8 flex gap-4 overflow-x-auto pb-2 sm:gap-5">
          {TEMPLATES.map((t) => (
            <TemplateCard key={t.key} template={t} onCreate={handleCreate} busy={creating !== null} creating={creating === t.key} />
          ))}
        </div>

        {/* premium / institutional templates */}
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-base font-medium text-[#1C1B1F] sm:text-lg">기업 · 기관용 템플릿</h2>
          <span className="rounded-full bg-[#EADDFF] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#21005D]">PRO</span>
        </div>
        <p className="mb-3 text-xs text-[#79747E]">개인정보 수집·이용 동의 문항이 기본으로 들어가 있어요.</p>
        <div className="mb-8 flex gap-4 overflow-x-auto pb-2 sm:gap-5">
          {PREMIUM_TEMPLATES.map((t) => (
            <TemplateCard key={t.key} template={t} onCreate={handleCreate} busy={creating !== null} creating={creating === t.key} premium />
          ))}
        </div>

        {/* recent forms */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-medium text-[#1C1B1F] sm:text-lg">최근 설문지</h2>
          <button
            onClick={() => setSortBy((s) => (s === "updated" ? "title" : "updated"))}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-[#49454F] hover:bg-[#1C1B1F]/[0.06] sm:text-sm"
          >
            <ArrowUpDown size={14} />
            {sortBy === "updated" ? "최근 수정순" : "이름순"}
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-[#79747E]">불러오는 중…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[#CAC4D0] bg-white/60 py-16 text-center text-sm text-[#79747E]">
            {query ? "검색 결과가 없어요." : "아직 만든 설문지가 없어요. 위에서 템플릿을 선택해 시작해보세요."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {filtered.map((f) => (
              <div
                key={f.id}
                className={`group relative overflow-hidden rounded-lg bg-white transition-shadow ${ELEV1_HOVER}`}
              >
                <button onClick={() => onOpenForm(f.id)} className="block w-full text-left">
                  <div className="h-[112px] border-b border-[#F1F3F4] bg-white sm:h-[128px]">
                    <FormThumbnail questions={f.questions || []} />
                  </div>
                  <div className="px-3 pb-2.5 pt-2.5">
                    <div className="truncate text-sm font-medium text-[#1C1B1F]">{f.title}</div>
                    <div className="mt-1 text-xs text-[#79747E]">{formatRelative(f.updatedAt)}</div>
                  </div>
                </button>

                <button
                  onClick={() => setOpenMenuId(openMenuId === f.id ? null : f.id)}
                  className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#49454F] opacity-0 shadow-sm hover:bg-white group-hover:opacity-100"
                >
                  <MoreVertical size={16} />
                </button>

                {openMenuId === f.id && (
                  <div className="absolute right-1.5 top-10 z-10 w-40 overflow-hidden rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5">
                    <button
                      onClick={() => onOpenForm(f.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#1C1B1F] hover:bg-[#F3EDF7]"
                    >
                      <ExternalLink size={14} /> 열기
                    </button>
                    <button
                      onClick={() => handleDuplicate(f.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#1C1B1F] hover:bg-[#F3EDF7]"
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
        <span className="absolute right-1.5 top-1.5 z-10 rounded-full bg-[#EADDFF] px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-[#21005D]">
          PRO
        </span>
      )}
      <div className="flex h-[104px] items-center justify-center border-b border-[#F1F3F4] bg-white sm:h-[118px]">
        {t.blank ? (
          <span className="relative flex h-9 w-9 items-center justify-center">
            <Plus size={34} strokeWidth={2.5} style={{ color: MD.primary }} />
          </span>
        ) : (
          <FormThumbnail questions={t.build().questions} accent={TYPE_COLORS[t.key === "contact" ? "short" : "radio"]} />
        )}
      </div>
      <div className="px-3 py-2.5 text-sm text-[#1C1B1F]">{t.label}</div>
    </button>
  );
}
