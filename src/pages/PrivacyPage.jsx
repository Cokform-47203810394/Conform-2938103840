import { useEffect } from "react";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { AnchorNav, DocumentCard, PublicPageShell } from "../components/PublicPageShell";

const platformSections = [
  ["서비스의 역할", "콕폼은 폼 작성자가 질문을 만들고 응답을 받을 수 있도록 제공하는 도구입니다. 각 폼의 수집 목적과 응답 내용에 관한 개인정보처리 책임은 원칙적으로 해당 폼 운영자에게 있습니다."],
  ["콕폼이 처리하는 정보", "작성자 Google 계정 식별자와 이메일, 폼 제목·질문 구조·운영 설정, 암호화된 응답 데이터, 생성·수정 시각, 서비스 보안·오류 기록, 중복 조회를 줄이기 위한 폼별 익명 브라우저 토큰을 처리할 수 있습니다."],
  ["참여 폼 이력", "응답 제출을 완료하면 해당 기기에는 폼 ID, 공개 폼 제목, 문항 수, 최초·최근 참여 시각만 편의 기능으로 기록됩니다. 로그인한 경우 같은 최소 이력만 계정에 동기화할 수 있습니다. 참여 이력에는 응답 원문, 이메일 입력값, 암호화 키, 응답 식별 토큰을 저장하지 않으며 다른 작성자·응답자는 조회할 수 없습니다."],
  ["응답 원문 보호", "응답은 제출자의 브라우저에서 폼별 공개키로 암호화된 뒤 저장됩니다. 콕폼 운영자와 저장소 제공자는 복호화 키를 보유하지 않으므로 응답 원문을 정상적으로 읽을 수 없도록 설계했습니다. 복호화와 CSV·Excel 변환은 폼 소유자 브라우저에서 수행됩니다."],
  ["보관과 파기", "응답은 폼 운영자가 설정한 보관기간에 따라 만료 시각이 정해집니다. 기본값은 180일이며 1일부터 3,650일 사이에서 설정할 수 있습니다. 만료된 암호화 응답 레코드는 매일 자동 파기하고, 파기 기록에는 폼별 건수만 남깁니다. 법령상 보존 의무가 있으면 해당 근거·항목·기간을 폼 운영자가 별도로 고지해야 합니다."],
  ["파기 방법과 예외", "만료 또는 작성자 삭제 시 콕폼 저장소의 암호화 응답 레코드와 연결된 만료 정보가 삭제됩니다. 작성자가 브라우저로 내보낸 CSV·Excel·JSON·이미지·프레젠테이션 파일은 콕폼이 회수하거나 파기할 수 없으므로, 작성자가 자신의 기기·공유 드라이브·협업 도구에서 별도로 관리해야 합니다."],
  ["조회 통계", "폼 운영 현황에는 폼별 조회 수와 응답 수만 표시됩니다. 조회 집계용 토큰은 IP 주소, 이메일, 응답 원문과 결합하지 않는 방식으로 설계됩니다. 통계 기능은 개인정보처리 책임을 대신하지 않습니다."],
];

const operatorSections = [
  ["폼을 만들기 전에", "수집 목적을 먼저 정하고 목적에 필요한 항목만 질문하세요. 이름·연락처·주소·지원서 내용 등 개인정보가 포함되면 수집 항목, 목적, 보유기간, 동의 거부권과 거부에 따른 불이익을 응답 화면에서 구체적으로 안내해야 합니다."],
  ["제3자 제공·처리위탁·국외 이전", "제3자 제공이나 처리위탁이 있으면 제공받는 자·수탁자, 목적, 항목, 보유기간을 별도로 고지하세요. 콕폼의 현재 Supabase 프로젝트는 대한민국 서울 리전에 구성되어 있으며, Cloudflare 전송 경로와 사용자가 직접 선택하는 Google Drive·Sheets 내보내기에는 해외 처리 가능성이 있을 수 있습니다. 실제 처리자·국가·계약 조건·거부 효과는 개인정보 국외이전 안내에서 확인하고, 암호화된다고 해서 국외 이전 고지가 자동으로 면제되는 것은 아닙니다."],
  ["고위험 정보와 아동", "주민등록번호, 건강정보, 생체정보 등 민감하거나 고위험인 정보의 수집은 기본적으로 피하세요. 만 14세 미만 아동 대상 폼은 법정대리인 동의와 본인 확인 절차가 필요할 수 있으므로 별도 법률 검토 없이 운영하지 마세요."],
  ["응답자 권리 요청", "응답자는 우선 해당 폼 운영자에게 열람·정정·삭제·처리정지·동의 철회 등을 요청해야 합니다. 콕폼은 암호화된 응답을 복호화할 수 없으므로 응답 원문 처리는 폼 운영자의 브라우저에서 수행해야 합니다."],
  ["내보낸 파일 관리", "응답을 CSV·Excel·JSON·이미지·프레젠테이션으로 내보내면 개인정보가 포함될 수 있습니다. 접근 권한, 저장 위치, 공유 대상, 보관·파기 기준은 폼 운영자가 직접 정하고 관리해야 합니다."],
];

const navItems = [
  { href: "#platform", label: "플랫폼 처리 기준" },
  { href: "#operator", label: "폼 운영자 기준" },
  { href: "#rights", label: "권리 행사와 문의" },
];

export default function PrivacyPage({ onBack }) {
  useEffect(() => {
    document.title = "콕폼 개인정보처리방침 | Cokform";
  }, []);

  return (
    <PublicPageShell eyebrow="개인정보 보호" title="개인정보처리방침" description="콕폼 플랫폼이 처리하는 정보와 폼 운영자가 직접 안내해야 하는 책임을 구분해 설명합니다." icon={ShieldCheck} onBack={onBack} aside={<AnchorNav items={navItems} />}>
      <DocumentCard tone="notice">
        <h2 className="font-semibold">운영 정보와 문서 갱신</h2>
        <p className="mt-1 text-sm leading-6">개인정보 보호 관련 문의는 <a href="mailto:seoharo0111@gmail.com" className="font-semibold underline underline-offset-2">seoharo0111@gmail.com</a>으로 보내주세요. 대표자·사업자 정보와 처리자의 계약·리전·보유기간처럼 추가 공개가 필요한 정보는 확인과 법률 검토 후 변경 이력과 함께 이 페이지에 반영합니다.</p>
      </DocumentCard>

      <section id="platform" className="scroll-mt-8">
        <div className="mb-3 flex items-center gap-2"><FileCheck2 size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">콕폼 플랫폼 처리 기준</h2></div>
        <DocumentCard><p className="text-sm leading-6 text-[#59645E]">이 방침은 콕폼이 처리하는 정보의 항목·목적·보유, 응답 원문 보호 방식, 권리 행사와 변경 이력을 설명합니다. 법령상 별도 동의가 필요한 개인정보 수집·이용, 제3자 제공 등의 사항은 각 폼 또는 해당 화면에서 별도로 명시적 동의를 받아야 합니다.</p></DocumentCard>
        <div className="mt-4 space-y-4">{platformSections.map(([title, body]) => <InfoSection key={title} title={title} body={body} />)}</div>
      </section>

      <section id="operator" className="scroll-mt-8 pt-3">
        <div className="mb-3 flex items-center gap-2"><FileCheck2 size={18} className="text-[#17866D]" /><h2 className="text-xl font-bold tracking-[-0.04em]">폼 운영자 확인 사항</h2></div>
        <DocumentCard><p className="text-sm leading-6 text-[#59645E]">응답을 수집하는 사람은 자신의 폼 목적과 항목에 맞는 별도 고지를 작성해야 합니다. 콕폼의 암호화 기능은 목적 외 수집, 과도한 수집, 부정확한 고지에 대한 면책을 제공하지 않습니다.</p></DocumentCard>
        <div className="mt-4 space-y-4">{operatorSections.map(([title, body]) => <InfoSection key={title} title={title} body={body} />)}</div>
      </section>

      <section id="rights" className="scroll-mt-8 pt-3">
        <DocumentCard tone="success">
          <h2 className="font-semibold text-[#0B4D3D]">국외 처리와 권리 행사</h2>
          <p className="mt-2 text-sm leading-6">국내 저장 구조와 Cloudflare·Google 선택 연동의 해외 처리 가능성은 <a href="/international-transfer" className="font-semibold underline underline-offset-2">개인정보 국외이전 안내</a>에서 확인하세요.</p>
          <p className="mt-2 text-sm leading-6">콕폼 계정·서비스 운영 정보에 대한 문의는 위 문의처로, 응답 원문에 대한 열람·정정·삭제 요청은 해당 폼 운영자에게 해주세요. 콕폼은 암호화된 응답 원문을 복호화할 수 없습니다.</p>
        </DocumentCard>
        <p className="mt-5 text-xs leading-5 text-[#78837C]">시행일: 2026년 8월 18일 · 문서 변경 시 시행일과 변경 내용을 이 페이지에 기록합니다.</p>
      </section>
    </PublicPageShell>
  );
}

function InfoSection({ title, body }) {
  return <DocumentCard><h3 className="text-base font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#59645E]">{body}</p></DocumentCard>;
}
