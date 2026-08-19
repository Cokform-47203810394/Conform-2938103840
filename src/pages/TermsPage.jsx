import { useEffect } from "react";
import { FileText } from "lucide-react";
import { DocumentCard, PublicPageShell } from "../components/PublicPageShell";

const sections = [
  ["약관의 적용과 이용 동의", "이용자는 콕폼에 접속하거나 계정을 만들고 서비스를 이용함으로써 이 약관, 개인정보처리방침 및 서비스 이용제한 정책의 적용에 동의한 것으로 봅니다. 개인정보 국외이전 안내는 콕폼 플랫폼의 처리 구조에 관한 고지 문서이며, 법령상 별도 동의가 필요한 사항은 이 약관 동의와 별개로 각 폼 또는 해당 화면에서 명시적으로 안내하고 동의를 받습니다."],
  ["약관의 변경", "콕폼은 약관을 바꿀 때 적용일, 변경 내용, 변경 사유를 이 페이지에 게시합니다. 일반 변경은 적용일 7일 전부터, 이용자에게 불리하거나 중요한 변경은 적용일 30일 전부터 안내합니다. 법령 또는 계약상 개별 통지가 필요한 경우에는 등록된 이메일 등 합리적인 수단으로 별도 알립니다. 긴급한 보안 조치나 법령 준수를 위한 변경은 필요한 범위에서 즉시 적용하고 가능한 한 신속하게 사후 안내합니다."],
  ["서비스의 역할", "콕폼은 이용자가 폼을 작성·공유하고 응답을 관리할 수 있도록 기술적 도구를 제공합니다. 폼 운영자가 수집하는 개인정보의 목적·범위·법적 근거와 응답 내용에 관한 책임은 원칙적으로 해당 폼 운영자에게 있습니다."],
  ["계정과 소유권", "작성자는 본인의 Google 계정으로 소유권을 확인하고 계정 접근 정보를 안전하게 관리해야 합니다. 작성자가 만든 폼의 질문·설명·브랜드 콘텐츠에 관한 권리는 관련 법령상 작성자 또는 정당한 권리자에게 귀속됩니다."],
  ["금지행위", "불법 정보, 타인의 권리를 침해하는 정보, 악성코드, 피싱·스팸, 협박·차별·성착취·불법 촬영물, 법령상 수집이 제한된 고위험 개인정보를 수집하거나 배포해서는 안 됩니다."],
  ["암호화의 범위와 한계", "콕폼은 응답 원문을 작성자 브라우저에서 암호화하는 구조를 사용하지만, 이용자 기기의 악성코드, 브라우저 확장프로그램, 계정 탈취, 작성자가 직접 내보낸 파일, 공동 작업자 권한 오남용까지 방지하지는 않습니다."],
  ["서비스 변경·중단", "보안 패치, 법령 준수, 장애 복구와 인프라 변경을 위해 서비스 일부가 변경·중단될 수 있습니다. 긴급 보안 조치는 사전 통지 없이 적용될 수 있으며 가능한 경우 사후 공지합니다."],
  ["책임 제한", "콕폼은 고의 또는 중대한 과실이 없는 한 이용자의 폼 운영, 응답자가 제공한 정보, 이용자의 법적 고지 누락으로 발생한 손해에 대해 책임을 부담하지 않습니다. 다만 관계 법령상 제한할 수 없는 책임은 제외합니다."],
  ["준거법과 문의", "본 약관은 대한민국 법률을 준거법으로 합니다. 서비스 이용 관련 문의는 seoharo0111@gmail.com으로 접수할 수 있습니다. 콕폼은 현재 사업자등록 전 파일럿 단계로 운영 주체의 상호·대표자명·사업자등록번호·사업장 주소는 사업자 등록과 공개 정보 확정 후 이 페이지와 개인정보처리방침에 변경 이력과 함께 반영합니다."],
];

export default function TermsPage({ onBack }) {
  useEffect(() => {
    document.title = "콕폼 서비스 이용약관 | Cokform";
  }, []);

  return (
    <PublicPageShell eyebrow="서비스 운영" title="서비스 이용약관" description="콕폼을 사용할 때 적용되는 기본 원칙과 작성자·폼 운영자의 책임 범위를 안내합니다." icon={FileText} onBack={onBack}>
      <DocumentCard tone="notice"><p className="text-sm leading-6">시행일: 2026년 8월 18일 · 서비스 운영 범위나 관계 법령 검토에 따라 약관 내용이 바뀌면 시행일과 변경 내용을 이 페이지에 안내합니다.</p></DocumentCard>
      <DocumentCard><p className="text-sm leading-6 text-[#59645E]">이용자는 <a href="/privacy" className="font-semibold underline underline-offset-2">개인정보처리방침</a>, <a href="/service-restrictions" className="font-semibold underline underline-offset-2">서비스 이용제한 정책</a>, <a href="/international-transfer" className="font-semibold underline underline-offset-2">개인정보 국외이전 안내</a>, <a href="/business-info" className="font-semibold underline underline-offset-2">사업자 안내</a>를 함께 확인해야 합니다. 각 문서에서 별도 동의·고지 또는 개별 폼 고지가 필요한 사항은 해당 절차가 우선합니다.</p></DocumentCard>
      <div className="space-y-4">{sections.map(([title, body]) => <DocumentCard key={title}><h2 className="text-base font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#59645E]">{body}</p></DocumentCard>)}</div>
      <p className="text-xs leading-5 text-[#78837C]">문의: <a href="mailto:seoharo0111@gmail.com" className="underline underline-offset-2">seoharo0111@gmail.com</a></p>
    </PublicPageShell>
  );
}
