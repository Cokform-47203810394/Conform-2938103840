import { ArrowLeft, FileText } from "lucide-react";

const sections = [
  ["서비스의 역할", "콕폼은 이용자가 폼을 작성·공유하고 응답을 관리할 수 있도록 기술적 도구를 제공합니다. 폼 운영자가 수집하는 개인정보의 목적·범위·법적 근거와 응답 내용에 관한 책임은 원칙적으로 해당 폼 운영자에게 있습니다."],
  ["계정과 소유권", "작성자는 본인의 Google 계정으로 소유권을 확인하고 계정 접근 정보를 안전하게 관리해야 합니다. 작성자가 만든 폼의 질문·설명·브랜드 콘텐츠에 관한 권리는 관련 법령상 작성자 또는 정당한 권리자에게 귀속됩니다."],
  ["금지행위", "불법 정보, 타인의 권리를 침해하는 정보, 악성코드, 피싱·스팸, 협박·차별·성착취·불법 촬영물, 법령상 수집이 제한된 고위험 개인정보를 수집하거나 배포해서는 안 됩니다."],
  ["암호화의 범위와 한계", "콕폼은 응답 원문을 작성자 브라우저에서 암호화하는 구조를 사용하지만, 이용자 기기의 악성코드, 브라우저 확장프로그램, 계정 탈취, 작성자가 직접 내보낸 파일, 공동 작업자 권한 오남용까지 방지하지는 않습니다."],
  ["서비스 변경·중단", "보안 패치, 법령 준수, 장애 복구와 인프라 변경을 위해 서비스 일부가 변경·중단될 수 있습니다. 긴급 보안 조치는 사전 통지 없이 적용될 수 있으며 가능한 경우 사후 공지합니다."],
  ["책임 제한", "콕폼은 고의 또는 중대한 과실이 없는 한 이용자의 폼 운영, 응답자가 제공한 정보, 이용자의 법적 고지 누락으로 발생한 손해에 대해 책임을 부담하지 않습니다. 다만 관계 법령상 제한할 수 없는 책임은 제외합니다."],
  ["준거법과 문의", "본 약관은 대한민국 법률을 준거법으로 합니다. 운영자·주소·문의처·사업자 정보는 공개 전 실제 정보로 확정합니다. 시행일과 변경 이력은 이 페이지에 표시합니다."],
];

export default function TermsPage({ onBack }) {
  return (
    <main className="min-h-screen bg-[#F5F3EC] px-4 py-8 text-[#17251F] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBack} className="mb-8 inline-flex items-center gap-2 text-sm text-[#59645E] hover:underline"><ArrowLeft size={16} /> 돌아가기</button>
        <header className="mb-8 rounded-3xl bg-[#17251F] p-6 text-white shadow-[0_12px_36px_rgba(23,37,31,0.16)] sm:p-8">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D8ED59] text-[#17251F]"><FileText size={24} /></div>
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-[#D8ED59]">COKFORM / TERMS</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">서비스 이용약관</h1>
          <p className="mt-4 text-sm leading-7 text-[#D6E1D8]">시행 예정일: 2026년 __월 __일 · 실제 공개 전 사업자 정보와 요금·환불 기준을 확정해야 합니다.</p>
        </header>
        <div className="mb-6 rounded-2xl border border-[#E4C77A] bg-[#FFF8DE] p-4 text-sm leading-6 text-[#65521A]">이 문서는 법률 검토 전 초안입니다. 유료화, 팀 협업, 파일 업로드, 메일 발송, 고객지원 범위가 확정되면 약관을 다시 검토해야 합니다.</div>
        <div className="space-y-4">{sections.map(([title, body]) => <section key={title} className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(23,37,31,0.06)] sm:p-6"><h2 className="text-base font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#59645E]">{body}</p></section>)}</div>
        <p className="mt-8 text-xs leading-5 text-[#78837C]">문의처: [실제 운영자 이메일 입력] · 사업자 정보: [공개 전 입력]</p>
      </div>
    </main>
  );
}
