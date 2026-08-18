import { useEffect } from "react";
import { BookOpen, ChevronRight, FileText, Globe2, LockKeyhole, MessageCircleQuestion, Palette, ShieldCheck, ShieldOff } from "lucide-react";
import { DocumentCard, PublicPageShell } from "../components/PublicPageShell";

const groups = [
  {
    label: "서비스",
    items: [
      { title: "폼 만들기", description: "개인정보 보호형 폼을 만들고 공유합니다.", href: "/" },
      { title: "보안과 응답 암호화", description: "응답이 암호화되어 저장되는 방식을 확인합니다.", href: "/security", icon: ShieldCheck },
      { title: "자주 묻는 질문", description: "키 관리, 응답 운영, 개인정보 고지의 기본을 확인합니다.", href: "/faq", icon: MessageCircleQuestion },
      { title: "사용 가이드", description: "폼 만들기, 응답 운영, 암호화 키 관리, 개인정보 수집 운영을 확인합니다.", href: "/docs", icon: BookOpen },
      { title: "브랜드 리소스", description: "공식 로고·심볼·색상·사용 원칙과 브랜드 문의 경로를 확인합니다.", href: "/resources", icon: Palette },
      { title: "브랜드 사용 가이드", description: "파일 형식·해상도 선택과 공식 표기·사용 원칙을 이 사이트에서 확인합니다.", href: "/docs/brand-guide", icon: Palette },
    ],
  },
  {
    label: "정책",
    items: [
      { title: "개인정보처리방침", description: "콕폼 플랫폼 처리와 폼 운영자 책임을 확인합니다.", href: "/privacy", icon: LockKeyhole },
      { title: "개인정보 국외이전 안내", description: "국내 저장 구조와 조건부 외부 연동의 해외 처리 가능성을 확인합니다.", href: "/international-transfer", icon: Globe2 },
      { title: "서비스 이용제한 정책", description: "금지행위, 비례적 조치, 이의제기와 보안 제보 기준을 안내합니다.", href: "/service-restrictions", icon: ShieldOff },
      { title: "이용약관", description: "서비스 이용과 운영 기준을 안내합니다.", href: "/terms", icon: FileText },
    ],
  },
];

export default function SitemapPage({ onBack }) {
  useEffect(() => {
    document.title = "콕폼 사이트맵 | Cokform";
  }, []);

  return (
    <PublicPageShell eyebrow="사이트 안내" title="필요한 페이지를 찾으세요" description="서비스 사용, 보안과 개인정보 처리 기준을 확인할 수 있는 콕폼의 공개 페이지를 모았습니다." onBack={onBack}>
      <div className="grid gap-5 md:grid-cols-2">
        {groups.map((group) => (
          <DocumentCard key={group.label}>
            <h2 className="text-sm font-bold tracking-[0.08em] text-[#17866D]">{group.label}</h2>
            <div className="mt-4 divide-y divide-[#E7E9E3]">
              {group.items.map(({ title, description, href, icon: Icon }) => (
                <a key={href} href={href} className="group flex gap-3 py-4 first:pt-0 last:pb-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF6EF] text-[#17866D]">{Icon ? <Icon size={18} /> : <ChevronRight size={18} />}</span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-sm font-semibold text-[#17251F] group-hover:text-[#0B4D3D]">{title}<ChevronRight size={14} /></span><span className="mt-1 block text-sm leading-6 text-[#59645E]">{description}</span></span>
                </a>
              ))}
            </div>
          </DocumentCard>
        ))}
      </div>

      <DocumentCard tone="success">
        <h2 className="font-semibold text-[#0B4D3D]">검색엔진용 XML 사이트맵</h2>
        <p className="mt-2 text-sm leading-6">검색엔진과 자동화 도구는 <a href="/sitemap.xml" className="font-semibold underline underline-offset-2">/sitemap.xml</a>을 사용할 수 있습니다. 이 페이지는 사람이 필요한 정보에 빠르게 도착할 수 있도록 만든 안내 페이지입니다.</p>
      </DocumentCard>
    </PublicPageShell>
  );
}
