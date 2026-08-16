import { ShieldCheck, ArrowLeft } from "lucide-react";

const sections = [
  ["무엇을 수집하나요?", "폼 운영자가 설정한 질문의 응답과 제출 시각을 수집합니다. 이메일 수집을 켠 경우에만 이메일 항목이 포함됩니다."],
  ["왜 수집하나요?", "폼 운영자가 고지한 목적에 한해 응답 접수, 운영, 결과 정리에 사용합니다. 목적이 없는 수집은 권장하지 않습니다."],
  ["얼마나 보관하나요?", "폼 운영자가 설정한 보관기간을 기준으로 관리합니다. 기본값은 180일이며, 운영자는 목적 달성 후 즉시 삭제할 수 있습니다."],
  ["콕폼이 응답을 볼 수 있나요?", "응답 내용은 제출자의 브라우저에서 폼별 공개키로 암호화된 뒤 저장됩니다. 콕폼 서버와 개발자는 복호화 키를 보유하지 않습니다. 복호화와 CSV·Excel 변환은 소유자 브라우저에서만 수행됩니다."],
  ["누가 책임지나요?", "각 폼의 운영자가 수집 목적, 항목, 보관기간, 제3자 제공 여부를 정하고 응답에 대한 개인정보처리 책임을 집니다. 콕폼은 암호화 저장 기능을 제공하는 도구입니다."],
];

export default function PrivacyPage({ onBack }) {
  return (
    <main className="min-h-screen bg-[#F5F3EC] px-4 py-8 text-[#17251F] sm:px-6">
      <div className="mx-auto max-w-2xl">
        <button onClick={onBack} className="mb-8 inline-flex items-center gap-2 text-sm text-[#59645E] hover:underline">
          <ArrowLeft size={16} /> 돌아가기
        </button>
        <header className="mb-8">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17251F] text-[#D8ED59]"><ShieldCheck size={24} /></div>
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-[#59645E]">COKFORM / PRIVACY</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">개인정보 안내</h1>
          <p className="mt-3 text-sm leading-6 text-[#59645E]">콕폼은 응답 내용을 가능한 한 운영자 브라우저 안에 남기는 것을 기본 방향으로 합니다. 아래 내용은 서비스 구조 안내이며, 각 폼 운영자의 별도 고지와 법적 의무를 대신하지 않습니다.</p>
        </header>
        <div className="space-y-3">
          {sections.map(([title, body]) => (
            <section key={title} className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(23,37,31,0.06)]">
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#59645E]">{body}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-xs leading-5 text-[#78837C]">실제 폼을 운영할 때는 수집 목적, 수집 항목, 보관기간, 동의 거부권, 제3자 제공·처리위탁 여부를 폼 화면에 구체적으로 적어주세요.</p>
      </div>
    </main>
  );
}
