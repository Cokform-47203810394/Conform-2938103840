import { useEffect } from "react";
import { ArrowLeft, ArrowUpRight, BookOpen, FileText, LockKeyhole, MessageCircleQuestion, ShieldCheck } from "lucide-react";

const groups = [
  {
    label: "서비스",
    items: [
      { title: "콕폼 시작하기", description: "개인정보 보호형 폼을 만들고 공유합니다.", href: "/" },
      { title: "보안과 응답 암호화", description: "응답이 암호화되어 저장되는 방식을 확인합니다.", href: "/security", icon: ShieldCheck },
      { title: "자주 묻는 질문", description: "키 관리, 응답 운영, 개인정보 고지의 기본을 확인합니다.", href: "/faq", icon: MessageCircleQuestion },
      { title: "Cokform 문서", description: "시작하기, 응답 운영, 암호화 키 관리, 개인정보 수집 운영을 한곳에서 확인합니다.", href: "/docs", icon: BookOpen },
    ],
  },
  {
    label: "정책과 신뢰",
    items: [
      { title: "개인정보처리방침", description: "콕폼 플랫폼 처리와 폼 운영자 책임을 확인합니다.", href: "/privacy", icon: LockKeyhole },
      { title: "이용약관", description: "서비스 이용과 운영 기준을 안내합니다.", href: "/terms", icon: FileText },
    ],
  },
];

export default function SitemapPage({ onBack }) {
  useEffect(() => {
    document.title = "콕폼 사이트맵 | Cokform";
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F3EC] px-4 py-8 text-[#17251F] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <a href="/" onClick={(event) => { event.preventDefault(); onBack?.(); }} className="mb-8 inline-flex items-center gap-2 text-sm text-[#59645E] hover:underline"><ArrowLeft size={16} /> 콕폼 홈으로</a>
        <header className="rounded-3xl bg-[#17251F] p-6 text-white shadow-[0_12px_36px_rgba(23,37,31,0.16)] sm:p-8">
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-[#D8ED59]">COKFORM / SITEMAP</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">콕폼 사이트맵</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D6E1D8]">서비스를 사용하거나, 보안과 개인정보 처리 기준을 확인할 때 필요한 공개 페이지를 한곳에 모았습니다.</p>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {groups.map((group) => (
            <section key={group.label} className="rounded-3xl border border-[#DDE1D9] bg-[#FFFDF8] p-5 shadow-[0_8px_30px_rgba(23,37,31,0.06)] sm:p-6">
              <h2 className="text-sm font-bold tracking-[0.1em] text-[#17866D]">{group.label}</h2>
              <div className="mt-4 divide-y divide-[#E7E9E3]">
                {group.items.map(({ title, description, href, icon: Icon }) => (
                  <a key={href} href={href} className="group flex gap-3 py-4 first:pt-0 last:pb-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6EF] text-[#17866D]">{Icon ? <Icon size={18} /> : <ArrowUpRight size={18} />}</span>
                    <span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-sm font-semibold text-[#17251F] group-hover:text-[#0B4D3D]">{title}<ArrowUpRight size={14} /></span><span className="mt-1 block text-sm leading-6 text-[#59645E]">{description}</span></span>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-[#B7DCC8] bg-[#F1FAF4] p-5 text-sm leading-6 text-[#355C45] sm:p-6">
          <h2 className="font-semibold text-[#0B4D3D]">검색엔진용 XML 사이트맵</h2>
          <p className="mt-2">검색엔진과 자동화 도구는 <a href="/sitemap.xml" className="font-semibold underline underline-offset-2">/sitemap.xml</a>을 사용할 수 있습니다. 이 페이지는 사람이 필요한 정보에 빠르게 도착할 수 있도록 만든 공개 안내 페이지입니다.</p>
        </section>
      </div>
    </main>
  );
}
