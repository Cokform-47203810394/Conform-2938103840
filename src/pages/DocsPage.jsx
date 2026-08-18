import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, ChevronRight, FileOutput, KeyRound, LockKeyhole, Palette, Scale, Search, ShieldCheck, Wrench } from "lucide-react";

const sections = [
  {
    id: "start",
    eyebrow: "START HERE",
    title: "처음 만드는 폼",
    description: "템플릿 선택부터 공개 링크 공유까지, 첫 폼을 안전하게 시작하는 순서입니다.",
    icon: BookOpen,
    links: [
      { title: "폼 만들기와 공유", body: "질문 구성, 개인키 금고 생성, 운영 설정, 공개 링크 점검을 순서대로 안내합니다.", href: "/docs/create-and-share" },
      { title: "응답자에게 보이는 화면", body: "공개 링크는 로그인 없이 열립니다. 공유 전 미리보기에서 질문·고지·마감 상태를 확인하세요.", href: "/faq" },
    ],
  },
  {
    id: "responses",
    eyebrow: "RESPONSES",
    title: "응답 운영과 내보내기",
    description: "응답 기간, 이메일 기록, 복호화, CSV·Excel·JSON·요약 자료 내보내기를 관리합니다.",
    icon: FileOutput,
    links: [
      { title: "응답 운영과 내보내기", body: "응답 확인, 수동 마감·재개, 내보내기 파일의 용도와 전체 삭제 전 점검을 다룹니다.", href: "/docs/responses-and-exports" },
      { title: "응답 기간과 마감", body: "시작·마감 시각을 설정하거나 즉시 마감·재개해 공개 제출 상태를 제어합니다.", href: "/faq" },
    ],
  },
  {
    id: "security",
    eyebrow: "SECURITY",
    title: "응답 암호화와 키 관리",
    description: "응답 평문이 어디에서 처리되는지, 개인키 금고와 복구 수단을 어떻게 관리하는지 설명합니다.",
    icon: ShieldCheck,
    links: [
      { title: "종단간 암호화와 키 관리", body: "보안 경계, 복구 비밀번호, 암호화 키 백업, 전체 복구 번들, 기기 교체 절차를 정리했습니다.", href: "/docs/e2ee-and-key-management" },
      { title: "복구 비밀번호를 잊었을 때", body: "Cokform은 복구 비밀번호를 재설정하거나 개인키를 대신 보관하지 않습니다. 키 백업·전체 복구 번들을 확인하세요.", href: "/faq" },
    ],
  },
  {
    id: "privacy",
    eyebrow: "PRIVACY OPERATIONS",
    title: "개인정보 수집 운영",
    description: "수집 목적·항목·보유기간을 고지하고, 동의와 보관기간을 실제 운영 내용에 맞추는 실무 가이드입니다.",
    icon: LockKeyhole,
    links: [
      { title: "개인정보 수집 운영", body: "최소 수집, 고지 표시, 동의 질문, 이메일 기록, 응답 보유·파기 전 점검 항목을 안내합니다.", href: "/docs/privacy-operations" },
      { title: "개인정보처리방침", body: "Cokform 플랫폼의 처리 기준과 폼 운영자의 책임 범위를 확인합니다.", href: "/privacy" },
    ],
  },
  {
    id: "trust",
    eyebrow: "BRAND & POLICY",
    title: "브랜드와 신뢰 정책",
    description: "공식 로고·색상·사용 기준과 국외 처리, 서비스 이용제한의 공개 원칙을 확인합니다.",
    icon: Scale,
    links: [
      { title: "브랜드 리소스와 사용 가이드", body: "공식 로고·마크·색상·사용 원칙과 형식·해상도 선택 기준을 Cokform 안에서 확인합니다.", href: "/docs/brand-guide" },
      { title: "개인정보 국외이전 안내", body: "국내 저장 구조와 Cloudflare·Google 선택 연동의 해외 처리 가능성을 구분해 공개합니다.", href: "/international-transfer" },
      { title: "서비스 이용제한 정책", body: "금지행위, 비례적 조치, 통지·이의제기·보안 제보 기준을 안내합니다.", href: "/service-restrictions" },
    ],
  },
  {
    id: "help",
    eyebrow: "TROUBLESHOOTING",
    title: "문제 해결과 지원",
    description: "금고 잠김, 응답 미수신, 공유 링크, 마감, 내보내기 문제를 스스로 점검합니다.",
    icon: Wrench,
    links: [
      { title: "문제 해결", body: "문제가 발생했을 때 확인할 순서와 지원 요청에 필요한 안전한 정보 범위를 정리했습니다.", href: "/docs/troubleshooting" },
      { title: "자주 묻는 질문", body: "키 관리·응답 운영·개인정보 고지의 핵심 질문을 빠르게 확인합니다.", href: "/faq" },
    ],
  },
];

export default function DocsPage({ onBack }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.title = "Cokform 문서 | 시작하기 · 보안 · 응답 운영";
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
          <a href="/" className="flex min-w-0 items-center gap-2.5"><img src={`${import.meta.env.BASE_URL}brand/cokform-mark.svg`} alt="콕폼" className="h-8 w-8" /><span className="truncate text-sm font-bold tracking-[-0.03em]">Cokform 문서</span></a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <p className="mb-3 font-mono text-[11px] font-bold tracking-[0.16em] text-[#17866D]">DOCUMENTATION</p>
            <p className="mb-2 text-xs font-medium text-[#78837C] lg:hidden">옆으로 넘겨 섹션 보기</p>
            <nav aria-label="문서 목차" className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible">
              {sections.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-[#59645E] transition hover:bg-[#EAF6EF] hover:text-[#0B4D3D] lg:shrink">{section.title}</a>
              ))}
            </nav>
            <div className="mt-5 hidden rounded-2xl border border-[#B7DCC8] bg-[#F1FAF4] p-4 text-xs leading-5 text-[#355C45] lg:block"><KeyRound size={16} className="mb-2 text-[#0B4D3D]" /><strong className="block text-[#0B4D3D]">키는 작성자가 관리합니다</strong><p className="mt-1">복구 비밀번호와 백업 파일은 별도 안전한 위치에 보관하세요.</p></div>
          </aside>

          <div className="min-w-0">
            <section className="overflow-hidden rounded-[28px] bg-[#17251F] px-6 py-8 text-white shadow-[0_16px_40px_rgba(23,37,31,0.16)] sm:px-9 sm:py-11">
              <p className="font-mono text-xs font-bold tracking-[0.18em] text-[#D8ED59]">COKFORM / HELP CENTER</p>
              <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.05em] sm:text-5xl">폼을 만들고, 안전하게 받고, 내 방식으로 운영하세요.</h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-[#D6E1D8] sm:text-base">처음 만드는 폼부터 응답 암호화, 개인정보 고지, 내보내기, 복구까지. Cokform을 실제 업무에 쓰기 위한 기준을 한곳에 모았습니다.</p>
              <label className="relative mt-7 block max-w-2xl"><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#17866D]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="문서에서 찾기: 예) 백업, 마감, 이메일, CSV" className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-white px-11 pr-4 text-sm text-[#17251F] outline-none placeholder:text-[#78837C] focus:ring-4 focus:ring-[#D8ED59]/40" /></label>
            </section>

            <section className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["6개", "핵심 문서 영역", BookOpen],
                ["E2EE", "개인키 금고·복구", ShieldCheck],
                ["실무형", "고지·보관·내보내기", FileOutput],
              ].map(([value, label, Icon]) => <div key={label} className="rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-4 shadow-[0_4px_14px_rgba(23,37,31,0.05)]"><Icon size={18} className="text-[#17866D]" /><div className="mt-3 text-xl font-bold tracking-[-0.04em]">{value}</div><div className="mt-1 text-xs text-[#78837C]">{label}</div></div>)}
            </section>

            <div className="mt-10 space-y-12">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                return (
                  <section id={section.id} key={section.id} className="scroll-mt-24">
                    <div className="flex gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EAF6EF] text-[#17866D]"><Icon size={21} /></span><div><p className="font-mono text-[11px] font-bold tracking-[0.15em] text-[#17866D]">{section.eyebrow}</p><h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] sm:text-3xl">{section.title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#59645E]">{section.description}</p></div></div>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {section.links.map((link) => (
                        <article key={link.title} className="group rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-5 shadow-[0_5px_18px_rgba(23,37,31,0.05)] transition hover:-translate-y-0.5 hover:border-[#B7DCC8] hover:shadow-[0_10px_25px_rgba(23,37,31,0.09)]">
                          <h3 className="text-base font-semibold tracking-[-0.02em] text-[#17251F]">{link.title}</h3><p className="mt-2 text-sm leading-6 text-[#59645E]">{link.body}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {link.href && <a href={link.href} className="inline-flex items-center gap-1 rounded-full bg-[#EAF6EF] px-3 py-1.5 text-xs font-semibold text-[#0B4D3D] transition hover:bg-[#D8F5E8]">Cokform 내부 문서 <ChevronRight size={13} /></a>}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
              {!visibleSections.length && <section className="rounded-2xl border border-dashed border-[#C9CEC6] bg-[#FFFDF8] p-8 text-center"><p className="font-semibold">“{query}” 관련 문서를 찾지 못했어요.</p><p className="mt-2 text-sm text-[#78837C]">검색어를 줄이거나, 문제 해결과 보안 문서를 먼저 확인해보세요.</p><button type="button" onClick={() => setQuery("")} className="mt-4 rounded-full bg-[#17251F] px-4 py-2 text-sm font-semibold text-white">검색 초기화</button></section>}
            </div>

            <section className="mt-12 rounded-3xl border border-[#B7DCC8] bg-[#F1FAF4] p-6 sm:p-8"><p className="font-mono text-[11px] font-bold tracking-[0.15em] text-[#17866D]">NEED MORE HELP?</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#0B4D3D]">복구 비밀번호나 응답 원문은 보내지 마세요.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#355C45]">문의에는 발생 시각, 기능, 화면의 오류 문구, 브라우저 환경만 정리하면 됩니다. 중요한 키·백업·응답 원문은 작성자가 직접 안전하게 관리하세요.</p><div className="mt-5 flex flex-wrap gap-3"><a href="/faq" className="inline-flex items-center gap-1.5 rounded-full bg-[#0B4D3D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#083A2E]">자주 묻는 질문 <ChevronRight size={15} /></a><a href="mailto:seoharo0111@gmail.com" className="inline-flex items-center gap-1.5 rounded-full border border-[#9ACCB0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0B4D3D] transition hover:bg-[#EAF6EF]">문의하기 <ArrowUpRight size={15} /></a></div></section>
          </div>
        </div>
      </div>
    </main>
  );
}
