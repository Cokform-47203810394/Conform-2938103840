import { useEffect } from "react";
import { ArrowLeft, ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";

const platformSections = [
  ["서비스의 역할", "콕폼은 폼 작성자가 질문을 만들고 응답을 받을 수 있도록 제공하는 도구입니다. 각 폼의 수집 목적과 응답 내용에 관한 개인정보처리 책임은 원칙적으로 해당 폼 운영자에게 있습니다."],
  ["콕폼이 처리하는 정보", "작성자 Google 계정 식별자와 이메일, 폼 제목·질문 구조·운영 설정, 암호화된 응답 envelope, 생성·수정 시각, 서비스 보안·오류 기록, 중복 조회를 줄이기 위한 폼별 익명 브라우저 토큰을 처리할 수 있습니다."],
  ["응답 원문 보호", "응답은 제출자의 브라우저에서 폼별 공개키로 암호화된 뒤 저장됩니다. 콕폼 운영자와 저장소 제공자는 복호화 키를 보유하지 않으므로 응답 원문을 정상적으로 읽을 수 없습니다. 복호화와 CSV·Excel 변환은 폼 소유자 브라우저에서 수행됩니다."],
  ["보관과 파기", "응답 보관기간은 폼 운영자가 목적에 맞게 설정합니다. 기본값은 180일이며, 목적이 달성되면 지체 없이 삭제해야 합니다. 법령상 보존 의무가 있는 경우에는 그 근거와 기간을 별도로 고지해야 합니다."],
  ["조회 통계", "폼 운영 현황에는 폼별 조회 수와 응답 수만 표시됩니다. 조회 집계용 토큰은 IP 주소, 이메일, 응답 원문과 결합하지 않는 방식으로 설계됩니다. 통계 기능은 개인정보처리 책임을 대신하지 않습니다."],
];

const operatorSections = [
  ["폼을 만들기 전에", "수집 목적을 먼저 정하고 목적에 필요한 항목만 질문하세요. 이름·연락처·주소·지원서 내용 등 개인정보가 포함되면 수집 항목, 목적, 보유기간, 동의 거부권과 거부에 따른 불이익을 응답 화면에서 구체적으로 안내해야 합니다."],
  ["제3자 제공·처리위탁·국외 이전", "제3자 제공이나 처리위탁이 있으면 제공받는 자·수탁자, 목적, 항목, 보유기간을 별도로 고지하세요. Supabase, Cloudflare, Google OAuth, 메일 발송 서비스의 실제 처리지역과 계약 조건은 운영 환경 확정 후 처리방침에 반영해야 합니다. 암호화된다고 해서 국외 이전 고지가 자동으로 면제되는 것은 아닙니다."],
  ["고위험 정보와 아동", "주민등록번호, 건강정보, 생체정보 등 민감하거나 고위험인 정보의 수집은 기본적으로 피하세요. 만 14세 미만 아동 대상 폼은 법정대리인 동의와 본인 확인 절차가 필요할 수 있으므로 별도 법률 검토 없이 운영하지 마세요."],
  ["응답자 권리 요청", "응답자는 우선 해당 폼 운영자에게 열람·정정·삭제·처리정지·동의 철회 등을 요청해야 합니다. 콕폼은 암호화된 응답을 복호화할 수 없으므로 응답 원문 처리는 폼 운영자의 브라우저에서 수행해야 합니다."],
];

export default function PrivacyPage({ onBack }) {
  useEffect(() => {
    document.title = "콕폼 개인정보처리방침 | Cokform";
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F3EC] px-4 py-8 text-[#17251F] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <button onClick={onBack} className="mb-8 inline-flex items-center gap-2 text-sm text-[#59645E] hover:underline"><ArrowLeft size={16} /> 돌아가기</button>
        <header className="mb-8 rounded-3xl bg-[#17251F] p-6 text-white shadow-[0_12px_36px_rgba(23,37,31,0.16)] sm:p-8">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D8ED59] text-[#17251F]"><ShieldCheck size={24} /></div>
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-[#D8ED59]">COKFORM / PRIVACY & LEGAL</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">개인정보·법적 안내</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#D6E1D8]">콕폼은 응답 내용을 가능한 한 운영자 브라우저에서만 읽을 수 있도록 설계합니다. 아래 안내는 콕폼 플랫폼의 처리와 폼 운영자의 책임을 분리해 설명합니다.</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#D6E1D8]"><span className="rounded-full bg-white/10 px-3 py-1.5">시행 예정일: 2026년 __월 __일</span><span className="rounded-full bg-white/10 px-3 py-1.5">파일럿 정책 초안</span></div>
        </header>

        <section className="mb-8 rounded-2xl border border-[#E4C77A] bg-[#FFF8DE] p-4 text-sm leading-6 text-[#65521A]">
          <strong>공개 전 필수 확정 항목:</strong> 대표자·법인명, 사업자등록번호, 주소, 개인정보 보호책임자와 이메일, 실제 데이터베이스·호스팅·메일 업체의 처리지역과 계약 정보는 운영자가 확정해 빈칸 없이 채워야 합니다. 이 페이지는 법률 자문을 대신하지 않습니다.
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(23,37,31,0.06)] sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><FileCheck2 size={19} className="text-[#17866D]" /> 콕폼 플랫폼 개인정보처리방침</h2>
            <p className="mt-2 text-sm leading-6 text-[#59645E]">정식 공개본에는 수집 항목·목적·보유기간, 법적 근거, 제3자 제공, 처리위탁, 국외 이전, 파기, 권리행사, 안전성 확보조치, 책임자, 변경 이력을 포함합니다.</p>
          </section>
          {platformSections.map(([title, body]) => <InfoSection key={title} title={title} body={body} />)}

          <section className="mt-8 rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(23,37,31,0.06)] sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold"><FileCheck2 size={19} className="text-[#17866D]" /> 폼 운영자 체크리스트</h2>
            <p className="mt-2 text-sm leading-6 text-[#59645E]">응답을 수집하는 사람은 자신의 폼 목적과 항목에 맞는 별도 고지를 작성해야 합니다. 콕폼의 암호화 기능은 목적 외 수집, 과도한 수집, 부정확한 고지에 대한 면책을 제공하지 않습니다.</p>
          </section>
          {operatorSections.map(([title, body]) => <InfoSection key={title} title={title} body={body} />)}

          <section className="rounded-2xl border border-[#B7DCC8] bg-[#F1FAF4] p-5 text-sm leading-6 text-[#355C45] sm:p-6">
            <h2 className="font-semibold text-[#0B4D3D]">권리 행사 및 문의</h2>
            <p className="mt-2">콕폼 계정·서비스 운영 정보에 대한 문의: <strong>[privacy@cokform.example — 실제 주소로 교체]</strong></p>
            <p className="mt-1">응답 원문에 대한 열람·정정·삭제 요청: 해당 폼의 운영자에게 문의하세요. 콕폼은 암호화된 응답 원문을 복호화할 수 없습니다.</p>
          </section>

          <section className="rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-5 sm:p-6">
            <h2 className="text-base font-semibold">공식 참고 기준</h2>
            <div className="mt-3 grid gap-2 text-sm text-[#59645E]"><a className="inline-flex items-center gap-1.5 hover:text-[#0B4D3D] hover:underline" href="https://www.pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=D010030000.Updated&nttId=12018" target="_blank" rel="noreferrer">개인정보보호위원회 처리방침 작성지침 <ExternalLink size={14} /></a><a className="inline-flex items-center gap-1.5 hover:text-[#0B4D3D] hover:underline" href="https://www.law.go.kr/lsInfoP.do?lsId=011357&ancYnChk=0" target="_blank" rel="noreferrer">국가법령정보센터 개인정보 보호법 <ExternalLink size={14} /></a></div>
          </section>
        </div>
        <p className="mt-8 text-xs leading-5 text-[#78837C]">최종 공개 전 실제 처리업체·리전·계약·문의처를 확인하고 법률 전문가의 검토를 받으세요. 문서 변경 시 시행일과 변경 내용을 기록합니다.</p>
      </div>
    </main>
  );
}

function InfoSection({ title, body }) {
  return <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(23,37,31,0.06)] sm:p-6"><h2 className="text-base font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[#59645E]">{body}</p></section>;
}
