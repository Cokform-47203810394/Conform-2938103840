import { useEffect } from "react";
import { AlertTriangle, Globe2, LockKeyhole, MapPin, ShieldCheck } from "lucide-react";
import { AnchorNav, DocumentCard, PublicPageShell } from "../components/PublicPageShell";

const navItems = [
  { href: "#scope", label: "안내 범위" },
  { href: "#domestic", label: "국내 저장 구조" },
  { href: "#external", label: "국외 처리 가능 기능" },
  { href: "#rights", label: "거부·문의" },
];

const rows = [
  ["웹 전송·보안", "Cloudflare 및 관련 처리자", "IP 주소, 브라우저·기기·접속 기술정보, HTTP 요청 메타데이터, 정적 웹 자산 요청", "전 세계 네트워크·미국 등 해외 처리 가능", "웹 접속 시 HTTPS·엣지 네트워크 처리", "웹 전송, 보안, 안정성·오류 대응", "웹 접속을 중단할 수 있으나 접속 필수 처리 거부 시 서비스 이용 제한 가능"],
  ["선택 내보내기", "Google Drive / Sheets", "사용자가 선택한 복호화 내보내기 파일과 파일명·형식 등 업로드 메타데이터", "Google이 고지하는 국가·지역·해외 처리 가능", "사용자가 내보내기를 실행하고 Google 권한을 허용할 때 브라우저에서 API 전송", "사용자가 선택한 Drive·Sheets 파일 생성", "권한을 허용하지 않거나 내보내기를 실행하지 않으면 됨. 해당 직접 내보내기 기능은 사용 불가"],
];

export default function InternationalTransferPage({ onBack }) {
  useEffect(() => { document.title = "콕폼 개인정보 국외이전·국외 처리 안내 | Cokform"; }, []);
  return <PublicPageShell eyebrow="개인정보 보호" title="개인정보 국외이전·국외 처리 안내" description="국내 저장 구조와 웹 전송·선택 연동에서 발생할 수 있는 해외 처리를 구분해 안내합니다." icon={Globe2} onBack={onBack} aside={<AnchorNav items={navItems} />}>
    <DocumentCard tone="notice"><div className="flex gap-3"><AlertTriangle size={20} className="mt-0.5 shrink-0" /><div><h2 className="font-semibold">문서 갱신 기준</h2><p className="mt-1 text-sm leading-6">이 안내는 2026-08-18 기준의 코드·배포 구성을 바탕으로 합니다. 실제 사업자 정보와 외부 처리자의 계약·리전·보유기간이 확인 또는 변경되면 변경 이력과 함께 갱신합니다.</p></div></div></DocumentCard>

    <section id="scope" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><Globe2 size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">안내 범위</h2></div><DocumentCard><p className="text-sm leading-7 text-[#59645E]">Cokform은 응답 내용을 제출자 브라우저에서 암호화하고, 작성자가 자신의 개인키로 읽도록 설계합니다. 다만 암호화 여부와 별개로 계정 식별자, 접속 기술정보, 암호문 응답, 폼 구조 등 개인정보 또는 개인정보와 결합될 수 있는 정보가 인프라·선택 연동을 통해 처리될 수 있습니다.</p><p className="mt-3 text-sm leading-7 text-[#59645E]">개인정보가 해외의 제3자에게 제공·처리위탁·보관되거나 해외에서 조회되는 경우에는 국외이전이 성립할 수 있습니다. 해외 사업자가 이용자로부터 직접 수집하는 경우와 Cokform이 외부 처리자에게 이전하는 경우는 구분해 검토합니다.</p></DocumentCard></section>

    <section id="domestic" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><MapPin size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">현재 국내 저장 구조</h2></div><DocumentCard tone="success"><h3 className="font-semibold text-[#0B4D3D]">Supabase · 대한민국 서울 리전</h3><p className="mt-2 text-sm leading-7">Cokform Supabase 프로젝트는 `ap-northeast-2`(대한민국 서울) 리전에 구성되어 있습니다. 폼 구조, 운영 설정, 작성자 인증 관련 데이터, 암호화된 응답 envelope, 응답 메타데이터, 참여 이력 등은 이 리전의 서비스 구성에서 처리·보관되도록 설정되어 있습니다.</p><p className="mt-3 text-sm leading-7">응답 평문은 제출자 브라우저에서 폼별 공개키로 암호화되고, 복호화는 작성자의 브라우저에서 개인키 금고를 연 경우에 수행됩니다. 이 구조는 응답 원문의 접근 범위를 줄이기 위한 기술적 설계이며, 별도 개인정보 처리·고지 의무를 대체하지 않습니다.</p></DocumentCard></section>

    <section id="external" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><ShieldCheck size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">국외 처리 가능 기능</h2></div><div className="overflow-x-auto rounded-xl border border-[#DDE1D9] bg-[#FFFDF8]"><table className="min-w-[900px] w-full text-left text-sm"><thead className="bg-[#EAF6EF] text-xs text-[#0B4D3D]"><tr>{["구분", "처리자", "처리 항목", "국가·지역", "시기·방법", "목적", "거부·효과"].map((title) => <th key={title} className="px-4 py-3 font-bold">{title}</th>)}</tr></thead><tbody className="divide-y divide-[#E7E9E3]">{rows.map((row) => <tr key={row[0]} className="align-top">{row.map((cell, index) => <td key={index} className="px-4 py-4 leading-6 text-[#59645E] first:font-semibold first:text-[#17251F]">{cell}</td>)}</tr>)}</tbody></table></div><p className="mt-3 text-xs leading-5 text-[#78837C]">Cloudflare는 전 세계 엣지 네트워크에서 트래픽을 처리할 수 있으며, 별도 데이터 현지화 기능으로 암호 해제·로그·메타데이터의 처리 위치를 제어하는 기능을 제공합니다. 콕폼은 현재 운영 구성에서 해당 기능의 적용 여부와 계약 조건을 주기적으로 점검합니다.</p></section>

    <section id="rights" className="scroll-mt-8"><div className="mb-3 flex items-center gap-2"><LockKeyhole size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">거부권·보호조치·문의</h2></div><div className="grid gap-4 md:grid-cols-2"><DocumentCard><h3 className="font-semibold">선택 기능은 사용자가 결정합니다</h3><p className="mt-2 text-sm leading-6 text-[#59645E]">Google Drive·Sheets 내보내기는 사용자가 직접 실행하고 Google 권한을 허용할 때만 동작합니다. 권한을 허용하지 않으면 해당 직접 내보내기 기능만 사용할 수 없습니다.</p></DocumentCard><DocumentCard><h3 className="font-semibold">변경과 권리 행사</h3><p className="mt-2 text-sm leading-6 text-[#59645E]">처리자, 국가, 항목, 보유기간 또는 근거가 바뀌면 이 페이지와 개인정보처리방침을 갱신합니다. 문의는 <a className="font-semibold underline underline-offset-2" href="mailto:seoharo0111@gmail.com">seoharo0111@gmail.com</a>으로 보내주세요.</p></DocumentCard></div><DocumentCard className="mt-4"><h3 className="font-semibold">참고 기준</h3><p className="mt-2 text-sm leading-6 text-[#59645E]">이 안내는 개인정보 보호법, 개인정보보호위원회 국외이전 안내, Cloudflare의 데이터 현지화 공개 자료를 참고해 작성했습니다. 관련 공식 자료는 이 페이지의 변경 이력에 반영해 관리합니다.</p></DocumentCard></section>
  </PublicPageShell>;
}
