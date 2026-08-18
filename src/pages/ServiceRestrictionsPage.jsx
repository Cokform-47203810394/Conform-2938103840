import { useEffect } from "react";
import { AlertTriangle, BadgeAlert, Gavel, MessageSquareMore, Scale, ShieldCheck } from "lucide-react";
import { AnchorNav, DocumentCard, PublicPageShell } from "../components/PublicPageShell";

const reasons = [
  ["불법·기만 행위", "법령 위반, 사기, 피싱, 불법 도박·광고·거래 유도", "가짜 이벤트·경품 폼, 금융정보 탈취 링크, 타인 사칭 접수"],
  ["개인정보 오남용", "수집 근거 없는 개인정보 수집, 민감·고유식별정보의 부적절한 수집·노출", "주민등록번호·건강정보를 정당한 절차 없이 요구, 응답 파일 무단 공개"],
  ["권리 침해", "저작권·상표권·초상권·명예·프라이버시 침해", "타인 콘텐츠·브랜드 사칭, 비방·괴롭힘·불법촬영물 유포"],
  ["보안·안정성 침해", "취약점 악용, 접근통제 우회, 악성코드 유포, 과도한 자동화 요청", "비인가 스크래핑, 대량 요청으로 과부하 유발, 응답자 기만 스크립트"],
  ["스팸·악성 배포", "대량 광고, 오인 유도 리디렉션, 악성 링크 배포", "폼을 이용한 피싱 메일·문자 확산, 자동 응답·도배"],
  ["계정·권한 부정 이용", "타인 계정 사용, 계정 거래·공유, 인증 우회", "계정 탈취 뒤 폼·응답 접근, 소유자 동의 없는 내보내기"],
];

const actions = [
  ["안내·시정 요청", "문제와 개선 방법을 안내하고 수정 기회를 제공합니다.", "경미한 고지 누락, 비의도적 브랜드 사용 오류"],
  ["임시 제한", "일부 기능, 특정 폼 공개, 계정 접근을 일시 제한할 수 있습니다.", "조사 중인 피싱·스팸 의심, 반복되는 운영 위반"],
  ["콘텐츠 비공개·삭제", "공개 링크 또는 명백히 위반되는 폼·콘텐츠를 차단·삭제할 수 있습니다.", "불법 콘텐츠, 피싱, 명백한 권리 침해"],
  ["계정 정지", "일정 기간 또는 영구적으로 서비스 접근을 제한할 수 있습니다.", "중대한 보안 침해, 반복·고의적 위반, 피해 확산"],
];

const navItems = [
  { href: "#principles", label: "적용 원칙" },
  { href: "#reasons", label: "제한 사유" },
  { href: "#actions", label: "조치 유형" },
  { href: "#appeal", label: "통지·이의제기" },
];

export default function ServiceRestrictionsPage({ onBack }) {
  useEffect(() => { document.title = "콕폼 서비스 이용제한 정책 | Cokform"; }, []);
  return <PublicPageShell eyebrow="서비스 운영" title="서비스 이용제한 정책" description="콕폼은 자유로운 폼 운영을 지지합니다. 동시에 응답자·작성자의 권리, 개인정보, 서비스 안정성을 침해하는 행위에는 필요한 범위의 조치를 적용합니다." icon={Scale} onBack={onBack} aside={<AnchorNav items={navItems} />}>
    <DocumentCard tone="notice"><div className="flex gap-3"><AlertTriangle size={20} className="mt-0.5 shrink-0" /><div><h2 className="font-semibold">적용과 갱신</h2><p className="mt-1 text-sm leading-6">이 정책은 이용약관, 개인정보처리방침 및 관계 법령과 함께 적용됩니다. 서비스 운영 범위나 관계 법령 검토에 따라 내용이 바뀌면 변경 이력과 함께 안내합니다.</p></div></div></DocumentCard>

    <section id="principles" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><Gavel size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">적용 원칙</h2></div><DocumentCard tone="success"><p className="text-sm leading-7">이용제한은 <strong className="text-[#0B4D3D]">필요한 범위에서, 사유·피해·반복성·고의성·긴급성을 고려해 비례적으로</strong> 적용합니다. 단순한 비판, 정당한 권리 행사, 선의의 보안 제보만으로 이용제한을 하지 않습니다.</p><p className="mt-3 text-sm leading-7">Cokform은 이용자의 폼 설계 자유도를 존중하지만, 다른 사람의 권리·안전·개인정보와 서비스 안정성을 침해하는 행위는 허용하지 않습니다.</p></DocumentCard></section>

    <section id="reasons" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><BadgeAlert size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">제한 사유</h2></div><div className="overflow-x-auto rounded-xl border border-[#DDE1D9] bg-[#FFFDF8]"><table className="min-w-[720px] w-full text-left text-sm"><thead className="bg-[#EAF6EF] text-xs text-[#0B4D3D]"><tr><th className="px-4 py-3">범주</th><th className="px-4 py-3">제한 사유</th><th className="px-4 py-3">예시</th></tr></thead><tbody className="divide-y divide-[#E7E9E3]">{reasons.map(([title, detail, example]) => <tr key={title} className="align-top"><td className="px-4 py-4 font-semibold">{title}</td><td className="px-4 py-4 leading-6 text-[#59645E]">{detail}</td><td className="px-4 py-4 leading-6 text-[#59645E]">{example}</td></tr>)}</tbody></table></div></section>

    <section id="actions" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">조치 유형</h2></div><div className="grid gap-3 md:grid-cols-2">{actions.map(([title, detail, example]) => <DocumentCard key={title}><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#59645E]">{detail}</p><p className="mt-3 rounded-xl bg-[#F5F3EC] px-3 py-2 text-xs leading-5 text-[#59645E]">일반적 적용 예: {example}</p></DocumentCard>)}</div><p className="mt-3 text-xs leading-5 text-[#78837C]">긴급한 보안 위험, 개인정보·안전 침해, 적법한 기관 요청 등에는 피해 확산 방지를 위해 임시 제한을 먼저 적용하고 가능한 범위에서 사후 안내할 수 있습니다.</p></section>

    <section id="appeal" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><MessageSquareMore size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">통지·이의제기·보안 제보</h2></div><div className="grid gap-4 md:grid-cols-2"><DocumentCard><h3 className="font-semibold">통지와 재검토</h3><p className="mt-2 text-sm leading-6 text-[#59645E]">원칙적으로 제한 사유, 조치 범위, 적용 시점, 이의제기 방법을 알립니다. 이견이 있으면 로그인 이메일, 폼 URL 또는 제목, 통지 시각·내용, 사실관계와 소명 자료를 <a className="font-semibold underline underline-offset-2" href="mailto:seoharo0111@gmail.com">seoharo0111@gmail.com</a>으로 보내주세요.</p></DocumentCard><DocumentCard><h3 className="font-semibold">선의의 보안 제보</h3><p className="mt-2 text-sm leading-6 text-[#59645E]">취약점을 발견했다면 공개 배포나 악용 전에 알려주세요. 취약점 악용, 타인 데이터 접근·추출, 서비스 가용성 저해, 제3자 피해를 주는 테스트는 선의의 제보로 보지 않습니다.</p></DocumentCard></div></section>
  </PublicPageShell>;
}
