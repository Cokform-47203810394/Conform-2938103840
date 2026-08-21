import { useEffect, useMemo, useState } from "react";
import { Check, Clipboard, Compass, FlaskConical, Keyboard, Sparkles, X } from "lucide-react";

const makeEggs = (category, items) => items.map(([key, title, description], index) => ({
  id: `${category}-${key}`,
  category,
  order: index + 1,
  title,
  description,
}));

export const EGG_GROUPS = {
  palette: { label: "표면", note: "색과 종이 감각만 바꿉니다." },
  reading: { label: "읽기", note: "현재 기기의 가독성 설정입니다." },
  motion: { label: "움직임", note: "폼 데이터와 제출에는 영향이 없습니다." },
  ritual: { label: "리듬", note: "작업 중 짧은 안내만 보여줍니다." },
  utility: { label: "도구", note: "명시적으로 눌렀을 때만 복사합니다." },
  play: { label: "놀이", note: "가벼운 시각 효과입니다." },
};

export const EASTER_EGGS = [
  ...makeEggs("palette", [
    ["mint", "새벽 민트", "조금 더 차가운 초록 표면"],
    ["paper", "크림 종이", "종이 질감을 살린 배경"],
    ["sea", "유리 바다", "청록 기운을 더한 표면"],
    ["clay", "붉은 흙", "따뜻한 점토색 테두리"],
    ["ink", "먹빛", "대비를 높인 잉크 모드"],
    ["ginkgo", "은행잎", "노랑 포인트를 얹은 표면"],
    ["dusk", "해질녘", "보랏빛 그림자가 있는 표면"],
    ["forest", "숲 바닥", "더 깊은 초록의 배경"],
    ["pebble", "조약돌", "채도를 낮춘 차분한 표면"],
    ["signal", "신호등", "작은 선명 포인트를 살린 표면"],
  ]),
  ...makeEggs("reading", [
    ["large", "한 칸 크게", "본문과 입력칸을 한 단계 크게"],
    ["compact", "빽빽한 작업대", "여백을 줄여 한 화면에 더 보기"],
    ["calm", "조용한 문장", "글자 간격을 조금 넓힌 읽기 모드"],
    ["focus", "초점선", "현재 포커스에 더 선명한 테두리"],
    ["serif", "작은 활자", "설명 문장에 명조 감각 부여"],
    ["mono", "정리 노트", "보조 문구를 고정폭 감각으로"],
    ["contrast", "명암 올리기", "약한 안내문 대비 강화"],
    ["soft", "부드러운 줄", "문단 줄높이를 조금 늘리기"],
    ["marker", "왼쪽 표식", "제목 앞에 작은 진행 표식"],
    ["quiet", "알림 다이어트", "비필수 장식을 차분하게"],
  ]),
  ...makeEggs("motion", [
    ["still", "정지 화면", "모든 비필수 움직임을 줄이기"],
    ["gentle", "느린 호흡", "패널에 아주 약한 호흡 효과"],
    ["snap", "빠른 반응", "버튼 반응을 더 또렷하게"],
    ["float", "떠 있는 메모", "실험실 패널에 작은 부유감"],
    ["glow", "미세 발광", "포인트 색에 약한 빛 번짐"],
    ["ripple", "물결 버튼", "눌렀을 때 작은 잔상"],
    ["blink", "커서 신호", "실험실 상태 표시를 점멸"],
    ["slide", "종이 넘김", "패널 전환을 수평으로"],
    ["bounce", "가벼운 반동", "완료 배지에 아주 짧은 반동"],
    ["pulse", "작업 맥박", "실험실 아이콘에 절제된 맥박"],
  ]),
  ...makeEggs("ritual", [
    ["minute", "1분 정리", "지금 하는 폼의 목적을 한 줄로 되묻기"],
    ["break", "잠깐 쉬기", "20분 작업 뒤 시선 쉬기 안내"],
    ["check", "마감 전 점검", "필수 문항·고지·마감 확인 문구"],
    ["kind", "친절한 질문", "응답자 관점으로 문장을 다시 보기"],
    ["short", "짧게 쓰기", "긴 설명을 한 문장 줄이기 제안"],
    ["plain", "쉬운 말", "전문어를 줄이는 작은 알림"],
    ["privacy", "최소 수집", "필요 없는 질문을 한번 더 보기"],
    ["review", "마지막 읽기", "공개 전 미리보기 확인 알림"],
    ["archive", "기록 남기기", "버전 복구 가능 여부 점검"],
    ["finish", "오늘의 마침표", "작업 종료 전 저장 상태 확인"],
  ]),
  ...makeEggs("utility", [
    ["title", "제목 초안", "폼 제목을 만드는 한 줄 틀"],
    ["purpose", "목적 초안", "수집 목적을 짧게 쓰는 틀"],
    ["consent", "동의 전 문장", "응답자에게 보여줄 짧은 안내"],
    ["closing", "마감 문장", "마감 시각을 알리는 문장"],
    ["thanks", "감사 문장", "제출 뒤 보여줄 짧은 인사"],
    ["reminder", "리마인드", "미제출자에게 보낼 중립적 알림"],
    ["brief", "운영 브리프", "팀에 공유할 3줄 요약"],
    ["checklist", "공개 체크", "공유 전 확인 항목"],
    ["handoff", "인수인계", "다음 운영자용 한 줄 기록"],
    ["blank", "빈칸 채우기", "폼 설명의 빈칸 구조"],
  ]),
  ...makeEggs("play", [
    ["sprout", "새싹", "작은 초록 점이 자라는 효과"],
    ["confetti", "종이 조각", "작은 종이 조각이 한번 지나감"],
    ["firefly", "반딧불", "실험실 주변에 작은 빛 점"],
    ["stamp", "완료 도장", "실험실 선택에 완료 도장"],
    ["orbit", "궤도", "아이콘 주변의 가는 원"],
    ["dots", "점선", "종이 위 점선 질감"],
    ["wave", "물결", "하단에 잔잔한 물결선"],
    ["star", "작은 별", "별 하나가 잠깐 나타남"],
    ["ticket", "입장권", "실험실 헤더를 티켓처럼"],
    ["secret", "오늘의 비밀", "하루 한 번 바뀌는 짧은 문장"],
  ]),
];

const STORAGE_KEY = "cokform:after-hours-lab";
const COPY_TEXT = {
  title: "[운영명] 신청",
  purpose: "본 양식은 [목적]을 위해 필요한 정보만 수집합니다.",
  consent: "제출 전 수집 목적과 보관 기간을 확인해 주세요.",
  closing: "신청은 [날짜·시각]까지 받습니다.",
  thanks: "응답해 주셔서 감사합니다.",
  reminder: "가능한 시점에 양식 제출을 부탁드립니다.",
  brief: "목적: [목적]\n대상: [대상]\n마감: [날짜·시각]",
  checklist: "□ 제목  □ 필수 문항  □ 개인정보 고지  □ 마감  □ 미리보기",
  handoff: "다음 운영자에게: [변경 사항] / [확인할 점]",
  blank: "# [제목]\n\n[무엇을 위한 양식인지 한 문장]\n\n- [응답자가 알아야 할 점]",
};

function getStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function isTypingTarget(target) {
  return target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
}

export default function EasterEggLayer() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(getStoredState);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const html = document.documentElement;
    Object.keys(EGG_GROUPS).forEach((group) => {
      const eggId = active[group] || "";
      if (eggId) html.dataset[`cok${group[0].toUpperCase()}${group.slice(1)}`] = eggId;
      else delete html.dataset[`cok${group[0].toUpperCase()}${group.slice(1)}`];
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(active)); } catch {}
  }, [active]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    let typed = "";
    const onKeyDown = (event) => {
      if (event.key === "Escape" && open) { setOpen(false); return; }
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      if (isTypingTarget(event.target)) return;
      typed = `${typed}${event.key.toLowerCase()}`.slice(-7);
      if (typed.endsWith("cokform")) setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const filtered = useMemo(() => EASTER_EGGS.filter((egg) => `${egg.title} ${egg.description} ${EGG_GROUPS[egg.category].label}`.includes(query.trim())), [query]);
  const latestRitual = active.ritual ? EASTER_EGGS.find((egg) => egg.id === active.ritual) : null;
  const latestTool = active.utility ? EASTER_EGGS.find((egg) => egg.id === active.utility) : null;

  const activate = (egg) => {
    setActive((current) => ({ ...current, [egg.category]: current[egg.category] === egg.id ? undefined : egg.id }));
    setNotice(`${egg.title} ${active[egg.category] === egg.id ? "해제" : "발견"}`);
  };

  const copyTool = async () => {
    const key = latestTool?.id?.replace("utility-", "");
    const text = COPY_TEXT[key];
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setNotice("초안 문구를 클립보드에 복사했어요.");
    } catch {
      setNotice("브라우저가 클립보드 접근을 막았어요. 문서를 열어 직접 복사해 주세요.");
    }
  };

  return (
    <>
      {notice && <div role="status" className="fixed bottom-4 left-1/2 z-[90] -translate-x-1/2 rounded-full border border-[#B7DCC8] bg-[#FFFDF8]/95 px-4 py-2 text-xs font-medium text-[#0B4D3D] shadow-lg backdrop-blur">{notice}</div>}
      {open && <div className="fixed inset-0 z-[80] flex items-end bg-[#17251F]/25 p-2 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label="콕폼 비공식 실험실">
        <section className="cok-lab-panel max-h-[min(780px,94dvh)] w-full max-w-5xl overflow-hidden rounded-2xl border border-[#B7DCC8] bg-[#FFFDF8] shadow-2xl">
          <header className="flex items-start gap-3 border-b border-[#DDE1D9] px-4 py-4 sm:px-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D8F5E8] text-[#0B4D3D]"><FlaskConical size={20} /></div>
            <div className="min-w-0"><p className="text-[11px] font-semibold tracking-[0.1em] text-[#17866D]">AFTER HOURS / UNOFFICIAL</p><h2 className="mt-0.5 text-xl font-semibold tracking-[-0.03em] text-[#17251F]">콕폼 비공식 실험실</h2><p className="mt-1 text-sm text-[#59645E]">60개 설정은 이 기기에만 저장됩니다. 폼·응답·권한에는 손대지 않아요.</p></div>
            <button type="button" onClick={() => setOpen(false)} className="ml-auto rounded-full p-2 text-[#59645E] hover:bg-[#EEF1EA]" aria-label="실험실 닫기"><X size={18} /></button>
          </header>
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E9E2] px-4 py-3 sm:px-6">
            <label className="sr-only" htmlFor="egg-search">실험 찾기</label><input id="egg-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="60개 실험에서 찾기" className="min-w-0 flex-1 rounded-full border border-[#C9CEC6] bg-white px-3 py-2 text-sm outline-none focus:border-[#17866D]" />
            <a href="/after-hours" className="inline-flex items-center gap-1.5 rounded-full border border-[#C9CEC6] px-3 py-2 text-xs font-semibold text-[#355C45] hover:bg-[#F1FAF4]"><Compass size={14} /> 비공식 docs</a>
            <button type="button" onClick={() => { setActive({}); setNotice("이 기기의 실험 설정을 모두 해제했어요."); }} className="rounded-full px-3 py-2 text-xs font-semibold text-[#59645E] hover:bg-[#EEF1EA]">전부 해제</button>
          </div>
          <div className="grid max-h-[60dvh] gap-4 overflow-y-auto p-4 sm:grid-cols-[minmax(0,1fr)_240px] sm:p-6">
            <div className="grid gap-2 sm:grid-cols-2">
              {filtered.map((egg) => {
                const enabled = active[egg.category] === egg.id;
                return <button key={egg.id} type="button" onClick={() => activate(egg)} aria-pressed={enabled} className={`group min-h-24 rounded-xl border p-3 text-left transition ${enabled ? "border-[#17866D] bg-[#EAF6EF]" : "border-[#DDE1D9] bg-white hover:border-[#A8CABB] hover:bg-[#F8FCF8]"}`}><div className="flex items-start gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] text-[#17866D]">{enabled ? <Check size={12} /> : egg.order}</span><div><p className="text-[11px] font-semibold tracking-[0.08em] text-[#17866D]">{EGG_GROUPS[egg.category].label}</p><p className="mt-0.5 text-sm font-semibold text-[#17251F]">{egg.title}</p><p className="mt-1 text-xs leading-5 text-[#59645E]">{egg.description}</p></div></div></button>;
              })}
            </div>
            <aside className="h-fit rounded-xl border border-[#DDE1D9] bg-[#F8F9F4] p-4"><div className="flex items-center gap-2 text-[#0B4D3D]"><Keyboard size={16} /><p className="text-sm font-semibold">여는 법</p></div><p className="mt-2 text-xs leading-5 text-[#59645E]"><kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd>, 또는 입력창 밖에서 <code>cokform</code>을 차례로 입력하세요.</p>{latestRitual && <div className="mt-4 border-t border-[#DDE1D9] pt-4"><p className="text-[11px] font-semibold tracking-[0.08em] text-[#17866D]">지금의 리듬</p><p className="mt-1 text-sm font-semibold text-[#17251F]">{latestRitual.title}</p><p className="mt-1 text-xs leading-5 text-[#59645E]">{latestRitual.description}</p></div>}{latestTool && <div className="mt-4 border-t border-[#DDE1D9] pt-4"><p className="text-[11px] font-semibold tracking-[0.08em] text-[#17866D]">가벼운 도구</p><p className="mt-1 text-sm font-semibold text-[#17251F]">{latestTool.title}</p><button type="button" onClick={copyTool} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#17866D] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0F705B]"><Clipboard size={13} /> 초안 복사</button></div>}<div className="mt-4 border-t border-[#DDE1D9] pt-4 text-xs leading-5 text-[#59645E]"><Sparkles size={14} className="mb-1 text-[#17866D]" />공개 응답 화면에서도 열리지만, 제출값·암호화 키·응답 원문에는 접근하지 않습니다.</div></aside>
          </div>
        </section>
      </div>}
    </>
  );
}
