import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, ChevronRight, FileOutput, LockKeyhole, Scale, Search, ShieldCheck, Wrench } from "lucide-react";

const sections = [
  {
    id: "start",
    label: "시작하기",
    title: "처음 만드는 폼",
    description: "템플릿 선택부터 공개 링크 공유까지, 첫 폼을 만드는 순서입니다.",
    icon: BookOpen,
    links: [
      { title: "폼 만들기와 공유", body: "질문 구성, 개인키 금고 생성, 운영 설정, 공개 링크 점검을 순서대로 안내합니다.", href: "/docs/create-and-share", action: "폼 만들기 가이드 보기" },
      { title: "응답자에게 보이는 화면", body: "공개 링크는 로그인 없이 열립니다. 공유 전 미리보기에서 질문, 고지, 마감 상태를 확인하세요.", href: "/faq", action: "응답 화면 확인하기" },
    ],
  },
  {
    id: "responses",
    label: "응답 운영",
    title: "응답 확인과 내보내기",
    description: "응답 기간, 이메일 기록, 복호화, CSV·Excel·JSON 내보내기를 관리합니다.",
    icon: FileOutput,
    links: [
      { title: "응답 운영과 내보내기", body: "응답 확인, 수동 마감·재개, 내보내기 파일의 용도와 전체 삭제 전 점검을 다룹니다.", href: "/docs/responses-and-exports", action: "내보내기 방법 보기" },
      { title: "응답 기간과 마감", body: "시작·마감 시각을 설정하거나 즉시 마감·재개해 공개 제출 상태를 제어합니다.", href: "/faq", action: "마감 설정 확인하기" },
    ],
  },
  {
    id: "security",
    label: "보안과 복구",
    title: "응답 암호화와 키 관리",
    description: "응답 원문이 어디에서 처리되는지와 개인키·복구 수단 관리 방법을 설명합니다.",
    icon: ShieldCheck,
    links: [
      { title: "종단간 암호화와 키 관리", body: "보안 경계, 복구 비밀번호, 암호화 키 백업, 전체 복구 번들, 기기 교체 절차를 정리했습니다.", href: "/docs/e2ee-and-key-management", action: "키 관리 방법 보기" },
      { title: "복구 비밀번호를 잊었을 때", body: "Cokform은 복구 비밀번호를 재설정하거나 개인키를 대신 보관하지 않습니다. 키 백업과 복구 번들을 확인하세요.", href: "/faq", action: "복구 방법 확인하기" },
    ],
  },
  {
    id: "privacy",
    label: "개인정보",
    title: "개인정보 수집 운영",
    description: "수집 목적·항목·보유기간을 고지하고, 실제 운영 내용에 맞춰 동의를 받는 기준입니다.",
    icon: LockKeyhole,
    links: [
      { title: "개인정보 수집 운영", body: "최소 수집, 고지 표시, 동의 질문, 이메일 기록, 응답 보유·파기 전 점검 항목을 안내합니다.", href: "/docs/privacy-operations", action: "수집 운영 가이드 보기" },
      { title: "개인정보처리방침", body: "Cokform 플랫폼의 처리 기준과 폼 운영자의 책임 범위를 확인합니다.", href: "/privacy", action: "처리방침 보기" },
    ],
  },
  {
    id: "trust",
    label: "브랜드와 정책",
    title: "브랜드 리소스와 운영 정책",
    description: "공식 로고와 사용 기준, 국외 처리, 서비스 이용제한의 공개 원칙을 확인합니다.",
    icon: Scale,
    links: [
      { title: "브랜드 리소스 사용 가이드", body: "공식 로고, 심볼, 색상, 사용 원칙과 형식·해상도 선택 기준을 확인합니다.", href: "/docs/brand-guide", action: "브랜드 가이드 보기" },
      { title: "개인정보 국외이전 안내", body: "국내 저장 구조와 선택 연동에서 발생할 수 있는 해외 처리를 구분해 안내합니다.", href: "/international-transfer", action: "국외이전 안내 보기" },
      { title: "서비스 이용제한 정책", body: "금지행위, 비례적 조치, 통지·이의제기·보안 제보 기준을 안내합니다.", href: "/service-restrictions", action: "이용제한 정책 보기" },
    ],
  },
  {
    id: "help",
    label: "문제 해결",
    title: "문제 해결과 지원",
    description: "금고 잠김, 응답 미수신, 공유 링크, 마감, 내보내기 문제를 확인합니다.",
    icon: Wrench,
    links: [
      { title: "문제 해결", body: "문제가 발생했을 때 확인할 순서와 지원 요청에 필요한 안전한 정보 범위를 정리했습니다.", href: "/docs/troubleshooting", action: "문제 해결 순서 보기" },
      { title: "자주 묻는 질문", body: "키 관리, 응답 운영, 개인정보 고지의 핵심 질문을 빠르게 확인합니다.", href: "/faq", action: "자주 묻는 질문 보기" },
    ],
  },
];

export default function DocsPage({ onBack }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Cokform 문서 | 폼 만들기 · 응답 운영 · 보안";
  }, []);

  const visibleSections = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return sections;
    return sections
      .map((section) => ({
        ...section,
        links: section.links.filter((link) => `${section.title} ${section.description} ${link.title} ${link.body}`.toLowerCase().includes(keyword)),
      }))
      .filter((section) => section.links.length > 0 || `${section.title} ${section.description}`.toLowerCase().includes(keyword));
  }, [query]);

  return (
    <main className="min-h-screen bg-[#F5F3EC] text-[#17251F]">
      <header className="sticky top-0 z-20 border-b border-[#DDE1D9] bg-[#FFFDF8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <a href="/" onClick={(event) => { event.preventDefault(); onBack?.(); }} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#59645E] transition hover:bg-[#EAF6EF] hover:text-[#0B4D3D]" aria-label="콕폼 홈으로"><ArrowLeft size={18} /></a>
          <a href="/" className="flex min-w-0 items-center gap-2.5"><img src={`${import.meta.env.BASE_URL}brand/cokform-mark.svg`} alt="콕폼" className="h-8 w-8" /><span className="truncate text-sm font-bold tracking-[-0.03em]">콕폼 사용 가이드</span></a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <p className="mb-3 text-xs font-bold tracking-[0.08em] text-[#17866D]">문서 목록</p>
            <p className="mb-2 text-xs font-medium text-[#78837C] lg:hidden">옆으로 넘겨 항목 보기</p>
            <nav aria-label="문서 목차" className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible">
              {sections.map((section) => <a key={section.id} href={`#${section.id}`} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-[#59645E] transition hover:bg-[#EAF6EF] hover:text-[#0B4D3D] lg:shrink">{section.title}</a>)}
            </nav>
          </aside>

          <div className="min-w-0">
            <section className="border-b border-[#DDE1D9] pb-7 sm:pb-9">
              <p className="text-xs font-bold tracking-[0.08em] text-[#17866D]">도움말</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-[-0.05em] sm:text-5xl">어떤 작업을 하시나요?</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#59645E] sm:text-base">폼 만들기, 응답 확인, 개인정보 수집 안내, 키 복구처럼 지금 필요한 작업을 찾아보세요.</p>
              <label className="relative mt-6 block max-w-2xl"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#17866D]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="문서에서 찾기: 예) 백업, 마감, 이메일, CSV" className="min-h-[50px] w-full rounded-xl border border-[#C9CEC6] bg-[#FFFDF8] px-11 pr-4 text-sm text-[#17251F] outline-none placeholder:text-[#78837C] focus:border-[#17866D] focus:ring-4 focus:ring-[#D8F5E8]" /></label>
            </section>

            <div className="mt-8 space-y-11">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <section id={section.id} key={section.id} className="scroll-mt-24">
                    <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6EF] text-[#17866D]"><Icon size={20} /></span><div><p className="text-xs font-bold tracking-[0.08em] text-[#17866D]">{section.label}</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{section.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#59645E]">{section.description}</p></div></div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {section.links.map((link) => (
                        <article key={link.title} className="rounded-xl border border-[#DDE1D9] bg-[#FFFDF8] p-5 transition hover:border-[#B7DCC8] hover:shadow-[0_8px_20px_rgba(23,37,31,0.06)]">
                          <h3 className="text-base font-semibold tracking-[-0.02em] text-[#17251F]">{link.title}</h3><p className="mt-2 text-sm leading-6 text-[#59645E]">{link.body}</p>
                          <a href={link.href} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#0B4D3D] transition hover:text-[#17866D]">{link.action}<ChevronRight size={15} /></a>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
              {!visibleSections.length && <section className="rounded-xl border border-dashed border-[#C9CEC6] bg-[#FFFDF8] p-8 text-center"><p className="font-semibold">“{query}” 관련 문서를 찾지 못했어요.</p><p className="mt-2 text-sm text-[#78837C]">검색어를 줄이거나 문제 해결 문서를 먼저 확인해보세요.</p><button type="button" onClick={() => setQuery("")} className="mt-4 rounded-xl bg-[#0F5B46] px-4 py-2 text-sm font-semibold text-white">검색 초기화</button></section>}
            </div>

            <section className="mt-12 border-t border-[#DDE1D9] pt-7"><h2 className="text-xl font-bold tracking-[-0.04em] text-[#17251F]">도움이 더 필요하신가요?</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#59645E]">문의에는 발생 시각, 사용한 기능, 화면의 오류 문구, 브라우저 환경만 정리해 주세요. 복구 비밀번호, 키 백업, 응답 원문은 보내지 마세요.</p><div className="mt-4 flex flex-wrap gap-3"><a href="/faq" className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F5B46] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B4D3D]">자주 묻는 질문 <ChevronRight size={15} /></a><a href="mailto:seoharo0111@gmail.com" className="inline-flex items-center gap-1.5 rounded-xl border border-[#B7DCC8] bg-[#FFFDF8] px-4 py-2.5 text-sm font-semibold text-[#0B4D3D] transition hover:bg-[#EAF6EF]">문의하기 <ArrowUpRight size={15} /></a></div></section>
          </div>
        </div>
      </div>
    </main>
  );
}
