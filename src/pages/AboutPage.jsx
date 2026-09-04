import { ArrowRight, Check, ChevronDown, Eye, FileText, LockKeyhole, MousePointer2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect } from "react";

const principles = [
  {
    number: "01",
    title: "묻는 사람의 자유",
    body: "정답이 정해진 폼이 아니라, 필요한 만큼 묻고 원하는 방식으로 구성합니다. 조건부 질문부터 맞춤 공개 주소까지 직접 정합니다.",
    icon: MousePointer2,
  },
  {
    number: "02",
    title: "응답자의 부담은 가볍게",
    body: "모바일에서 바로 쓰고, 새로고침해도 이어서 작성합니다. 긴 설명 대신 필요한 안내만 보여주고, 답변 흐름을 방해하지 않습니다.",
    icon: FileText,
  },
  {
    number: "03",
    title: "보이지 않아야 할 것은 보이지 않게",
    body: "응답 원문은 작성자만 읽도록 설계했습니다. 폼을 운영하는 사람도, Cokform도 원문을 대신 읽지 않는 경계를 지킵니다.",
    icon: LockKeyhole,
  },
];

const useCases = [
  { label: "채용", detail: "팀별 지원서와 포트폴리오 접수" },
  { label: "신청", detail: "행사·프로그램·예약 접수" },
  { label: "의견", detail: "고객 VOC와 내부 피드백" },
  { label: "운영", detail: "동아리·커뮤니티·프로젝트 관리" },
];

function SectionLabel({ children }) {
  return <p className="text-xs font-bold tracking-[0.13em] text-[#17866D]">{children}</p>;
}

function MiniFormPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[430px] lg:ml-auto">
      <div className="absolute -right-3 -top-5 h-16 w-16 rounded-full bg-[#D8ED59] blur-[1px] sm:-right-8 sm:-top-8 sm:h-24 sm:w-24" aria-hidden="true" />
      <div className="relative rotate-[1.2deg] border border-[#C6D5C9] bg-[#FFFDF8] p-5 shadow-[10px_14px_0_#D8ED59] sm:p-7">
        <div className="flex items-center justify-between border-b border-[#DDE1D9] pb-4">
          <div className="flex items-center gap-2"><img src="/brand/cokform-mark.svg" alt="" className="h-7 w-7" /><span className="text-sm font-bold tracking-[-0.03em] text-[#17251F]">프로젝트 참여 신청</span></div>
          <span className="text-[11px] font-semibold text-[#17866D]">응답 중</span>
        </div>
        <div className="space-y-5 pt-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-[#17251F]">어떤 일에 함께하고 싶나요?</span><span className="text-[10px] text-[#D85B4A]">필수</span></div>
            <div className="flex items-center justify-between border-b border-[#B8C5BA] pb-2 text-sm text-[#78837C]"><span>제품을 만들고 싶어요</span><ChevronDown size={15} /></div>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold text-[#17251F]">가장 자신 있는 경험을 알려주세요</div>
            <div className="h-16 border border-[#DDE1D9] bg-[#F7F8F3] p-3 text-xs leading-5 text-[#9AA59D]">여기에 편한 방식으로 답해 주세요.</div>
          </div>
          <div className="flex items-center justify-between border-t border-[#F0EEE6] pt-4"><span className="text-[11px] text-[#78837C]">이 기기에 임시저장됨</span><span className="inline-flex items-center gap-1 rounded-full bg-[#17866D] px-3 py-1.5 text-[11px] font-bold text-white"><Check size={12} /> 제출하기</span></div>
        </div>
      </div>
      <div className="absolute -bottom-7 -left-3 border border-[#C6D5C9] bg-[#17251F] px-4 py-3 text-xs font-semibold text-[#F7F7EE] shadow-[4px_4px_0_#17866D] sm:-left-9"><span className="text-[#D8ED59]">●</span> 필요한 것만, 콕</div>
    </div>
  );
}

export default function AboutPage({ onBack }) {
  useEffect(() => {
    document.title = "Cokform이란 · 콕폼";
    return () => { document.title = "콕폼 · 한국 실무에 맞춘 폼"; };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F5F3EC] text-[#17251F]">
      <header className="sticky top-0 z-30 border-b border-[#DDE1D9]/90 bg-[#F5F3EC]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-4 py-3 sm:px-6 sm:py-4">
          <a href="/" onClick={(event) => { if (onBack) { event.preventDefault(); onBack(); } }} className="inline-flex shrink-0 items-center gap-2.5" aria-label="콕폼 홈으로">
            <img src="/brand/cokform-mark.svg" alt="" className="h-9 w-9" />
            <span className="text-lg font-extrabold tracking-[-0.05em]">콕폼</span>
          </a>
          <nav aria-label="소개 페이지 메뉴" className="hidden items-center gap-6 text-sm font-medium text-[#59645E] md:flex">
            <a href="#why" className="transition hover:text-[#0B4D3D]">왜 콕폼인가</a>
            <a href="#principles" className="transition hover:text-[#0B4D3D]">우리가 지키는 것</a>
            <a href="#start" className="transition hover:text-[#0B4D3D]">시작하기</a>
          </nav>
          <a href="/" className="inline-flex items-center gap-1.5 rounded-full bg-[#17866D] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0F705B] active:scale-[0.97] sm:text-sm">폼 만들기 <ArrowRight size={15} /></a>
        </div>
      </header>

      <section className="relative border-b border-[#DDE1D9]" aria-labelledby="about-hero-title">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-16 sm:px-6 sm:pb-32 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20 lg:pt-28">
          <div className="relative z-10">
            <SectionLabel>FORM, CLEARLY</SectionLabel>
            <h1 id="about-hero-title" className="mt-5 max-w-2xl text-[clamp(2.7rem,8vw,5.9rem)] font-bold leading-[1.02] tracking-[-0.075em] text-[#17251F]">필요한 걸 묻고,<br /><span className="text-[#17866D]">제대로 받아요.</span></h1>
            <p className="mt-7 max-w-lg text-[17px] leading-8 text-[#59645E] sm:text-lg">Cokform은 한국의 일하는 방식에 맞춘 폼 서비스입니다. 설문을 만드는 데서 끝나지 않고, 응답을 받고 다음 일을 시작하는 데까지 함께합니다.</p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a href="/" className="inline-flex items-center gap-2 rounded-full bg-[#17251F] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0B4D3D] active:scale-[0.97]">무료로 시작하기 <ArrowRight size={16} /></a>
              <a href="#why" className="inline-flex items-center gap-2 px-2 py-3.5 text-sm font-bold text-[#0B4D3D] transition hover:text-[#17866D]">더 알아보기 <ChevronDown size={16} /></a>
            </div>
            <p className="mt-5 text-xs leading-5 text-[#78837C]">가입 없이 응답할 수 있고, 작성자는 Google 로그인으로 폼을 관리합니다.</p>
          </div>
          <div className="relative pt-4 sm:pt-6 lg:pt-12"><MiniFormPreview /></div>
        </div>
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-52 w-52 rounded-full border-[26px] border-[#EAF6EF] sm:-bottom-28 sm:-right-4 sm:h-72 sm:w-72" aria-hidden="true" />
      </section>

      <section id="why" className="scroll-mt-24 border-b border-[#DDE1D9]" aria-labelledby="why-title">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24">
            <div><SectionLabel>WHY COKFORM</SectionLabel><h2 id="why-title" className="mt-4 max-w-md text-3xl font-bold leading-tight tracking-[-0.06em] sm:text-4xl">폼은 쉬워야 하고,<br />일은 이어져야 하니까.</h2></div>
            <div><p className="max-w-2xl text-xl font-medium leading-9 tracking-[-0.03em] text-[#355C45] sm:text-2xl sm:leading-10">좋은 폼은 질문을 많이 담는 도구가 아니라, 필요한 답을 정확히 받는 도구입니다.</p><p className="mt-7 max-w-2xl text-base leading-8 text-[#59645E]">Cokform은 구글폼처럼 익숙하게 시작하되, 한국 실무에서 자주 필요한 조건부 질문·개인정보 안내·응답 관리·복구를 한 흐름 안에 담았습니다. 만드는 사람은 덜 헤매고, 응답하는 사람은 덜 지칩니다.</p></div>
          </div>
          <div className="mt-16 grid border-y border-[#DDE1D9] sm:grid-cols-4">{useCases.map((item, index) => <div key={item.label} className={`py-6 sm:px-5 ${index > 0 ? "border-t border-[#DDE1D9] sm:border-l sm:border-t-0" : ""}`}><p className="text-xl font-bold tracking-[-0.05em]">{item.label}</p><p className="mt-2 text-sm leading-6 text-[#78837C]">{item.detail}</p></div>)}</div>
        </div>
      </section>

      <section id="principles" className="scroll-mt-24 border-b border-[#DDE1D9] bg-[#EAF6EF]" aria-labelledby="principles-title">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-end"><div><SectionLabel>WHAT WE KEEP</SectionLabel><h2 id="principles-title" className="mt-4 max-w-lg text-3xl font-bold leading-tight tracking-[-0.06em] sm:text-4xl">자유롭게 만들되,<br />선은 분명하게.</h2></div><p className="max-w-sm text-sm leading-7 text-[#59645E]">기능을 늘리는 것보다 폼을 쓰는 사람의 시간을 아끼는 일을 먼저 생각합니다.</p></div>
          <div className="mt-14 grid gap-0 border-t border-[#B7DCC8] lg:grid-cols-3">{principles.map(({ number, title, body, icon: Icon }) => <article key={number} className="border-b border-[#B7DCC8] py-7 sm:py-9 lg:border-b-0 lg:border-l lg:px-7 lg:first:border-l-0 lg:first:pl-0"><div className="flex items-center justify-between"><span className="text-xs font-bold tracking-[0.04em] text-[#17866D]">{number}</span><Icon size={20} strokeWidth={1.8} className="text-[#17866D]" /></div><h3 className="mt-10 text-xl font-bold tracking-[-0.04em]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#59645E]">{body}</p></article>)}</div>
        </div>
      </section>

      <section className="border-b border-[#DDE1D9] bg-[#17251F] text-[#F7F7EE]" aria-labelledby="security-title">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-24">
          <div><SectionLabel>PRIVATE BY DESIGN</SectionLabel><h2 id="security-title" className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-[-0.06em] sm:text-5xl">응답은<br /><span className="text-[#D8ED59]">작성자의 것</span>이니까.</h2><p className="mt-7 max-w-lg text-base leading-8 text-[#B9C9BD]">Cokform은 응답 원문을 대신 읽는 서비스가 되지 않으려고 합니다. 암호화된 응답과 작성자 키의 경계를 지키고, 복구가 필요한 순간에는 원래 데이터를 보존하는 쪽을 선택합니다.</p><a href="/docs/e2ee-and-key-management" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-[#D8ED59] transition hover:text-white">암호화 방식 보기 <ArrowRight size={16} /></a></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><div className="border-l-2 border-[#D8ED59] bg-white/[0.06] px-5 py-5"><div className="flex items-center gap-3"><ShieldCheck size={20} className="text-[#D8ED59]" /><p className="font-bold">작성자만 읽는 응답</p></div><p className="mt-3 text-sm leading-6 text-[#AFC1B4]">서버와 운영자는 응답 원문을 볼 수 없도록 설계했습니다.</p></div><div className="border-l-2 border-[#17866D] bg-white/[0.06] px-5 py-5"><div className="flex items-center gap-3"><Eye size={20} className="text-[#8DE4C3]" /><p className="font-bold">필요한 만큼만 수집</p></div><p className="mt-3 text-sm leading-6 text-[#AFC1B4]">개인정보 안내와 수집 범위를 폼 안에서 직접 고지합니다.</p></div><div className="border-l-2 border-[#DDE1D9] bg-white/[0.06] px-5 py-5 sm:col-span-2 lg:col-span-1"><div className="flex items-center gap-3"><Sparkles size={20} className="text-[#D8ED59]" /><p className="font-bold">복구를 기본값으로</p></div><p className="mt-3 text-sm leading-6 text-[#AFC1B4]">삭제보다 보존을 우선하고, 버전과 백업을 통해 다시 돌아올 길을 남깁니다.</p></div></div>
        </div>
      </section>

      <section id="start" className="scroll-mt-24" aria-labelledby="start-title">
        <div className="mx-auto max-w-6xl px-5 py-24 sm:px-6 sm:py-32"><div className="max-w-3xl"><SectionLabel>START WITH A QUESTION</SectionLabel><h2 id="start-title" className="mt-4 text-[clamp(2.4rem,7vw,5.3rem)] font-bold leading-[1.04] tracking-[-0.08em]">잘 묻는 일부터,<br /><span className="text-[#17866D]">콕폼으로 시작해요.</span></h2><p className="mt-7 max-w-xl text-base leading-8 text-[#59645E]">채용 지원서든, 행사 신청서든, 고객 의견이든 괜찮습니다. 필요한 질문을 만들고 링크를 보내면 됩니다.</p><div className="mt-9 flex flex-wrap gap-3"><a href="/" className="inline-flex items-center gap-2 rounded-full bg-[#17866D] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#0F705B] active:scale-[0.97]">지금 폼 만들기 <ArrowRight size={16} /></a><a href="/docs" className="inline-flex items-center gap-2 rounded-full border border-[#B7DCC8] bg-[#FFFDF8] px-5 py-3.5 text-sm font-bold text-[#0B4D3D] transition hover:bg-[#EAF6EF]">사용 가이드 보기</a></div></div></div>
      </section>

      <footer className="border-t border-[#DDE1D9] bg-[#FFFDF8]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-7 text-xs text-[#78837C] sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-2"><img src="/brand/cokform-mark.svg" alt="" className="h-6 w-6" /><span className="font-bold text-[#17251F]">콕폼</span><span>· 필요한 걸 묻고, 내 방식으로 받아보세요.</span></div><div className="flex flex-wrap gap-x-4 gap-y-2"><a href="/" className="transition hover:text-[#0B4D3D]">폼 만들기</a><a href="/privacy" className="transition hover:text-[#0B4D3D]">개인정보처리방침</a><a href="/status" className="transition hover:text-[#0B4D3D]">Cokform State</a></div></div>
      </footer>
    </main>
  );
}
