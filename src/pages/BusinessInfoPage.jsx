import { useEffect } from "react";
import { Building2, Mail, ShieldCheck } from "lucide-react";
import { DocumentCard, PublicPageShell } from "../components/PublicPageShell";

const businessItems = [
  ["서비스명", "Cokform (콕폼)"],
  ["운영 단계", "사업자등록 전 비공개 파일럿 운영"],
  ["상호·대표자명", "사업자 등록과 공개 정보 확정 후 이 페이지에 게시합니다."],
  ["사업자등록번호", "사업자 등록 후 게시합니다."],
  ["사업장 주소", "사업자 등록과 공개 정보 확정 후 게시합니다."],
  ["고객 문의", "seoharo0111@gmail.com"],
  ["개인정보 보호책임자", "지정 후 성명과 연락처를 개인정보처리방침에 함께 게시합니다."],
];

export default function BusinessInfoPage({ onBack }) {
  useEffect(() => {
    document.title = "콕폼 사업자 안내 | Cokform";
  }, []);

  return (
    <PublicPageShell
      eyebrow="서비스 운영 정보"
      title="사업자 안내"
      description="콕폼의 현재 운영 단계와 공식 문의 경로, 사업자 정보 공개 상태를 안내합니다."
      icon={Building2}
      onBack={onBack}
    >
      <DocumentCard tone="notice">
        <h2 className="font-semibold">현재는 비공개 파일럿 단계입니다</h2>
        <p className="mt-2 text-sm leading-6">콕폼은 사업자등록 전 비공개 파일럿으로 운영 중입니다. 상호·대표자명·사업자등록번호·사업장 주소는 사업자 등록과 공개 정보 확정 후 이 페이지, 개인정보처리방침, 이용약관에 같은 내용으로 반영합니다. 확인되지 않은 정보를 임의로 고지하지 않습니다.</p>
      </DocumentCard>

      <section className="grid gap-4 sm:grid-cols-2">
        {businessItems.map(([label, value]) => (
          <DocumentCard key={label}>
            <h2 className="text-sm font-bold tracking-[0.04em] text-[#17866D]">{label}</h2>
            {label === "고객 문의" ? (
              <a href={`mailto:${value}`} className="mt-2 inline-flex text-sm font-semibold text-[#0B4D3D] underline underline-offset-2">{value}</a>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[#59645E]">{value}</p>
            )}
          </DocumentCard>
        ))}
      </section>

      <DocumentCard tone="success">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-[#17866D]" />
          <div>
            <h2 className="font-semibold text-[#0B4D3D]">개인정보와 서비스 정책</h2>
            <p className="mt-2 text-sm leading-6">개인정보 처리 기준, 국외 처리 가능성, 서비스 이용 원칙은 각각의 공개 문서에서 확인할 수 있습니다. 사업자 정보가 확정되면 세 문서의 운영 주체·문의 정보를 함께 갱신합니다.</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-[#0B4D3D]">
              <a href="/privacy" className="underline underline-offset-2">개인정보처리방침</a>
              <a href="/terms" className="underline underline-offset-2">이용약관</a>
              <a href="/international-transfer" className="underline underline-offset-2">개인정보 국외이전 안내</a>
            </div>
          </div>
        </div>
      </DocumentCard>

      <DocumentCard>
        <div className="flex items-start gap-3">
          <Mail size={20} className="mt-0.5 shrink-0 text-[#17866D]" />
          <div>
            <h2 className="font-semibold">정보 정정 또는 문의</h2>
            <p className="mt-2 text-sm leading-6 text-[#59645E]">사업자 안내 내용의 정정 요청이나 서비스 운영 문의는 <a href="mailto:seoharo0111@gmail.com" className="font-semibold underline underline-offset-2">seoharo0111@gmail.com</a>으로 보내주세요.</p>
          </div>
        </div>
      </DocumentCard>

      <p className="text-xs leading-5 text-[#78837C]">시행일: 2026년 8월 19일 · 사업자 정보 확정 시 변경일과 변경 내용을 함께 기록합니다.</p>
    </PublicPageShell>
  );
}
