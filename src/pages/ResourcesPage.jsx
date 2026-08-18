import { useEffect } from "react";
import { ArrowUpRight, BadgeCheck, BookOpen, Check, Download, FileWarning, Palette, ShieldCheck, Sparkles } from "lucide-react";
import { AnchorNav, DocumentCard, PublicPageShell } from "../components/PublicPageShell";

const colors = [
  ["Deep Green", "#0F5B46", "핵심 브랜드 면·심볼 바탕"],
  ["Cokform Green", "#17866D", "상태·링크·인터랙션"],
  ["Leaf Green", "#73B99D", "보조 라인·그래픽"],
  ["Soft Mint", "#EAF7EF", "밝은 보조 면"],
  ["Ink Green", "#123D31", "타이포그래피·어두운 표현"],
  ["Warm White", "#FFFDF8", "밝은 표면·배경"],
];

const navItems = [
  { href: "#assets", label: "공식 자산" },
  { href: "#colors", label: "색상" },
  { href: "#usage", label: "사용 원칙" },
  { href: "#policy", label: "정책·문의" },
];

export default function ResourcesPage({ onBack }) {
  useEffect(() => { document.title = "Cokform 브랜드 리소스 센터"; }, []);

  return (
    <PublicPageShell
      eyebrow="COKFORM / BRAND RESOURCES"
      title="Cokform을 정확하게 소개할 수 있는 공식 리소스입니다."
      description="로고, 마크, 색상, 서비스명 표기와 브랜드 사용 원칙을 확인하세요. Cokform은 고객의 자유도를 우선하고, 개인정보 보호를 그 자유를 가능하게 하는 기반으로 생각합니다."
      icon={Palette}
      onBack={onBack}
      aside={<AnchorNav items={navItems} />}
    >
      <DocumentCard tone="success"><div className="flex gap-3"><BadgeCheck size={21} className="mt-0.5 shrink-0 text-[#0B4D3D]" /><div><h2 className="font-semibold text-[#0B4D3D]">공식성 확인</h2><p className="mt-1 text-sm leading-6">공식 로고는 이 페이지와 Cokform 저장소의 `public/brand` 경로에서만 받으세요. Cokform의 파트너십·보증·승인이 있는 것처럼 보이게 하는 사용은 허용되지 않습니다.</p></div></div></DocumentCard>

      <section id="assets" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><Sparkles size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">공식 자산</h2></div><div className="grid gap-4 md:grid-cols-2"><article className="overflow-hidden rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] shadow-[0_6px_20px_rgba(23,37,31,0.05)]"><div className="flex min-h-48 items-center justify-center bg-white p-8"><img src="/brand/cokform-logo.svg" alt="콕폼 기본 로고" className="w-full max-w-sm" /></div><div className="border-t border-[#DDE1D9] p-5"><h3 className="font-semibold">기본 로고</h3><p className="mt-1 text-sm leading-6 text-[#59645E]">밝은 배경의 문서, 웹 화면, 소개 자료에 사용합니다.</p><a href="/brand/cokform-logo.svg" download className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#0F5B46] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0B4D3D]"><Download size={14} /> SVG 다운로드</a></div></article><article className="overflow-hidden rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] shadow-[0_6px_20px_rgba(23,37,31,0.05)]"><div className="flex min-h-48 items-center justify-center bg-[#EAF7EF] p-8"><img src="/brand/cokform-mark.svg" alt="콕폼 심볼 마크" className="h-28 w-28" /></div><div className="border-t border-[#DDE1D9] p-5"><h3 className="font-semibold">심볼 마크</h3><p className="mt-1 text-sm leading-6 text-[#59645E]">앱 아이콘, 프로필, 좁은 영역에서만 사용합니다.</p><a href="/brand/cokform-mark.svg" download className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#B7DCC8] bg-white px-3.5 py-2 text-xs font-semibold text-[#0B4D3D] transition hover:bg-[#EAF6EF]"><Download size={14} /> SVG 다운로드</a></div></article></div></section>

      <section id="colors" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><Palette size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">색상 시스템</h2></div><div className="grid gap-3 sm:grid-cols-2">{colors.map(([name, hex, usage]) => <article key={hex} className="flex items-center gap-4 rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-4 shadow-[0_4px_14px_rgba(23,37,31,0.04)]"><span className="h-12 w-12 shrink-0 rounded-xl border border-black/5" style={{ backgroundColor: hex }} /><div className="min-w-0"><h3 className="font-semibold">{name}</h3><p className="mt-0.5 font-mono text-xs text-[#17866D]">{hex}</p><p className="mt-1 text-xs text-[#78837C]">{usage}</p></div></article>)}</div></section>

      <section id="usage" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><Check size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">사용 원칙</h2></div><div className="grid gap-4 md:grid-cols-2"><DocumentCard><h3 className="font-semibold text-[#0B4D3D]">권장</h3><ul className="mt-3 space-y-2 text-sm leading-6 text-[#59645E]"><li>• 원본 SVG의 비율과 색상을 유지합니다.</li><li>• 흰색 또는 충분히 대비되는 단색 배경에 사용합니다.</li><li>• 첫 표기는 `콕폼(Cokform)` 또는 `콕폼`으로 씁니다.</li><li>• `작성자만 자신의 키로 읽도록 설계`처럼 검증 가능한 설명을 사용합니다.</li></ul></DocumentCard><DocumentCard tone="notice"><h3 className="font-semibold">피해야 할 사용</h3><ul className="mt-3 space-y-2 text-sm leading-6"><li>• 로고의 비율·색상·방향을 임의로 변경하는 행위</li><li>• 낮은 대비의 사진·패턴 위에 바로 배치하는 행위</li><li>• 제휴·승인·보증이 있는 것처럼 보이게 하는 사용</li><li>• "완벽한 보안", "해킹 불가" 등 절대적 보장 표현</li></ul></DocumentCard></div></section>

      <section id="policy" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">정책과 문의</h2></div><div className="grid gap-3 sm:grid-cols-2"><a href="/docs" className="group rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-5 shadow-[0_5px_18px_rgba(23,37,31,0.05)] transition hover:border-[#B7DCC8]"><BookOpen size={20} className="text-[#17866D]" /><h3 className="mt-3 font-semibold">제품 문서</h3><p className="mt-1 text-sm leading-6 text-[#59645E]">기능, 보안, 개인정보 수집 운영, 내보내기 가이드를 확인합니다.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D3D]">문서 열기 <ArrowUpRight size={13} /></span></a><a href="mailto:seoharo0111@gmail.com" className="group rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-5 shadow-[0_5px_18px_rgba(23,37,31,0.05)] transition hover:border-[#B7DCC8]"><FileWarning size={20} className="text-[#17866D]" /><h3 className="mt-3 font-semibold">브랜드 사용 문의</h3><p className="mt-1 text-sm leading-6 text-[#59645E]">언론·파트너 소개, 공식 로고 요청, 사용 가능 여부를 문의하세요.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0B4D3D]">문의하기 <ArrowUpRight size={13} /></span></a></div></section>
    </PublicPageShell>
  );
}
