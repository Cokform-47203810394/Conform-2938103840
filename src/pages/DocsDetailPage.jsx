import { useEffect } from "react";
import { ArrowRight, BookOpen, CheckCircle2, FileOutput, LockKeyhole, Palette, ShieldCheck, Wrench } from "lucide-react";
import { AnchorNav, DocumentCard, PublicPageShell } from "../components/PublicPageShell";

const guides = {
  "create-and-share": {
    eyebrow: "시작하기",
    title: "폼 만들기와 공유",
    description: "첫 질문을 구성하고 개인키 금고를 준비한 뒤, 응답자에게 공개 링크를 전달하기까지의 기본 흐름입니다.",
    icon: BookOpen,
    sections: [
      {
        id: "before",
        title: "시작 전 확인",
        paragraphs: [
          "폼을 만들려면 Google 로그인이 필요합니다. 반면 공개 링크를 통해 응답하는 사람은 로그인하지 않아도 됩니다.",
          "응답 내용을 읽으려면 폼을 처음 만들 때 개인키 금고를 준비해야 합니다. 복구 비밀번호는 Cokform이 알거나 재설정할 수 없으므로, 다른 서비스와 겹치지 않는 긴 문구를 정하고 안전한 별도 위치에 보관하세요.",
        ],
      },
      {
        id: "flow",
        title: "만들기 흐름",
        table: {
          headers: ["단계", "해야 할 일", "확인 기준"],
          rows: [
            ["1. 시작점", "빈 양식 또는 업무 목적에 맞는 템플릿을 선택합니다.", "템플릿은 시작점일 뿐, 실제 수집 목적과 고지는 운영자가 확인합니다."],
            ["2. 질문 구성", "흐름 탭에서 질문 유형과 필수 여부를 설정합니다.", "제목은 응답 화면과 내보내기 열 이름에 그대로 쓰입니다."],
            ["3. 키 금고", "운영 탭에서 개인키 금고와 복구 비밀번호를 설정합니다.", "공유 전 키 백업 또는 전체 복구 번들을 준비합니다."],
            ["4. 운영 설정", "응답 기간, 이메일 기록, 사본 요청, 중복 제출 제한, 보관기간을 설정합니다.", "필요한 설정만 켜고 개인정보 고지와 실제 운영을 맞춥니다."],
            ["5. 미리보기·공유", "응답자 화면을 점검한 뒤 링크를 복사하거나 공유를 시작합니다.", "질문, 고지, 응답 가능 기간과 문의처를 확인합니다."],
          ],
        },
      },
      {
        id: "checklist",
        title: "공유 전 체크리스트",
        checks: [
          "개인키 금고와 복구 비밀번호를 준비했습니다.",
          "응답 시작·마감 시각이 실제 운영 일정과 맞습니다.",
          "개인정보 수집 안내, 동의, 이메일 기록 설정이 실제 목적과 맞습니다.",
          "폼 설명에 운영자 문의 방법을 적었습니다.",
        ],
      },
    ],
    related: [
      ["응답 운영과 내보내기", "/docs/responses-and-exports"],
      ["개인키 금고와 복구", "/docs/e2ee-and-key-management"],
      ["개인정보 수집 운영", "/docs/privacy-operations"],
    ],
  },
  "responses-and-exports": {
    eyebrow: "응답 운영",
    title: "응답 운영과 내보내기",
    description: "복호화된 응답을 확인하고, 응답 기간·내보내기·삭제를 목적에 맞게 운영하는 방법입니다.",
    icon: FileOutput,
    sections: [
      {
        id: "responses",
        title: "응답 확인",
        paragraphs: [
          "답변 탭에서 응답 수, 선택형 질문 요약, 자유 입력 답변과 이메일 기록을 확인합니다. 개인키 금고가 잠겨 있으면 응답 원문과 암호화된 버전 기록은 볼 수 없습니다.",
          "금고가 잠긴 상태에서도 질문과 운영 설정은 편집할 수 있습니다. 답변과 버전 기록이 필요할 때만 복구 비밀번호로 금고를 여세요.",
        ],
      },
      {
        id: "exports",
        title: "형식별 내보내기",
        table: {
          headers: ["형식", "권장 용도", "주의할 점"],
          rows: [
            ["CSV", "스프레드시트·분석 도구로 가져오기", "수식처럼 해석될 수 있는 값은 텍스트로 처리됩니다."],
            ["Excel 호환 파일", "Excel에서 바로 검토", "불필요한 개인정보 열을 지운 뒤 공유하세요."],
            ["JSON", "개발·백업·시스템 연계", "구조화된 질문·응답 데이터가 포함될 수 있습니다."],
            ["요약 PNG·PPTX", "선택형 응답의 비식별 요약 공유", "자유 입력 원문은 포함하지 않는 요약 자료입니다."],
            ["Google Drive·Sheets", "사용자 계정의 Drive에 직접 파일 생성", "사용자가 권한을 허용하고 직접 내보내기를 실행할 때만 동작합니다."],
          ],
        },
      },
      {
        id: "retention",
        title: "마감·삭제·보관",
        checks: [
          "시작·마감 시각 또는 수동 마감 상태를 공개 링크에서 한 번 확인합니다.",
          "전체 응답 삭제 전 필요한 파일을 안전한 기기에 내보냈는지 확인합니다.",
          "수집 목적과 보관기간이 끝났는지 확인합니다.",
          "복호화된 내보내기 파일도 조직의 보관 기준에 맞게 정리합니다.",
        ],
      },
    ],
    related: [
      ["개인키 금고와 복구", "/docs/e2ee-and-key-management"],
      ["개인정보 수집 운영", "/docs/privacy-operations"],
      ["문제 해결", "/docs/troubleshooting"],
    ],
  },
  "e2ee-and-key-management": {
    eyebrow: "보안과 복구",
    title: "종단간 암호화와 키 관리",
    description: "응답 평문이 어디에서 처리되는지, 개인키 금고와 복구 수단을 어떻게 작성자가 관리하는지 설명합니다.",
    icon: ShieldCheck,
    sections: [
      {
        id: "boundary",
        title: "보안 경계",
        table: {
          headers: ["구성 요소", "역할", "응답 평문 접근"],
          rows: [
            ["응답자 브라우저", "폼 입력, 공개키 기반 암호화, 제출", "제출 전 입력값을 처리"],
            ["Cokform 웹 앱", "폼 작성·공개 화면·복호화 도구 제공", "개인키가 열린 작성자 브라우저에서만 처리"],
            ["저장 경로", "암호문 응답·폼 구조·운영 메타데이터 보관", "개인키가 없으므로 암호문을 보관하도록 설계"],
            ["폼 작성자", "개인키 금고 해제, 응답 복호화·내보내기", "자신의 복구 비밀번호와 키로 접근"],
          ],
        },
      },
      {
        id: "vault",
        title: "개인키 금고와 복구 비밀번호",
        paragraphs: [
          "폼별 개인키는 브라우저의 암호화된 금고로 보관됩니다. 금고가 잠기면 응답 평문과 메모리상의 복호화 결과는 화면에서 제거됩니다.",
          "복구 비밀번호는 Cokform이 알 수 없고 재설정할 수 없습니다. 12자 이상인 고유한 긴 문구를 사용하고, 비밀번호와 백업 파일을 같은 장소에만 두지 마세요.",
        ],
      },
      {
        id: "recovery",
        title: "백업과 기기 교체",
        table: {
          headers: ["도구", "포함 대상", "권장 사용처"],
          rows: [
            ["암호화 키 백업", "암호화된 개인키 금고", "기기 교체·브라우저 초기화 대비"],
            ["전체 복구 번들", "키 금고, 폼 구조, 암호문 응답, 버전 기록", "저장소 장애·대규모 복구 대비"],
          ],
        },
      },
    ],
    related: [
      ["폼 만들기와 공유", "/docs/create-and-share"],
      ["응답 운영과 내보내기", "/docs/responses-and-exports"],
      ["문제 해결", "/docs/troubleshooting"],
    ],
  },
  "privacy-operations": {
    eyebrow: "개인정보 수집",
    title: "개인정보 수집 운영",
    description: "수집 목적·항목·보유기간을 실제 운영에 맞게 고지하고, 필요한 정보만 받는 실무 기준입니다.",
    icon: LockKeyhole,
    sections: [
      {
        id: "principles",
        title: "수집 전 원칙",
        paragraphs: [
          "질문을 추가하기 전에 수집 목적, 필요한 항목, 보유기간, 응답자 문의 방법을 먼저 정리하세요. 목적에 필요하지 않은 항목은 수집하지 않는 것이 기본입니다.",
          "민감정보나 고유식별정보처럼 고위험 정보가 필요하다면 정당한 근거와 별도 절차를 검토해야 합니다. Cokform의 기능이 운영자의 법적 책임을 대신하지는 않습니다.",
        ],
      },
      {
        id: "settings",
        title: "Cokform에서 설정할 항목",
        table: {
          headers: ["설정", "사용 시점", "운영 기준"],
          rows: [
            ["개인정보 수집 안내 표시", "개인정보를 받는 질문이 있을 때", "수집 목적·항목·보유기간·문의처를 실제 운영에 맞게 적습니다."],
            ["개인정보 동의 질문", "동의가 필요한 수집일 때", "동의하지 않아도 되는 선택 항목과 필수 항목을 구분합니다."],
            ["이메일 주소 기록", "이메일이 운영에 정말 필요할 때", "기록 사실과 이용 목적을 응답자에게 보이게 합니다."],
            ["응답 보관기간", "파기 기준을 정해야 할 때", "목적 달성 뒤 삭제할 기준일을 설정하고 지킵니다."],
          ],
        },
      },
      {
        id: "after",
        title: "수집 뒤 관리",
        checks: [
          "응답을 볼 수 있는 사람과 내보내기 파일의 접근 범위를 최소화합니다.",
          "목적이 끝난 응답과 복호화된 내보내기 파일을 지체 없이 정리합니다.",
          "응답자 문의가 오면 수집 목적, 처리 상태, 삭제 가능 여부를 확인합니다.",
          "처리 구조가 바뀌면 공개 고지와 관련 정책을 함께 갱신합니다.",
        ],
      },
    ],
    related: [
      ["개인정보처리방침", "/privacy"],
      ["국외이전·국외 처리 안내", "/international-transfer"],
      ["폼 만들기와 공유", "/docs/create-and-share"],
    ],
  },
  troubleshooting: {
    eyebrow: "문제 해결",
    title: "문제 해결",
    description: "금고 잠김, 응답 제출, 공유 링크, 내보내기 문제를 안전한 순서로 점검하는 방법입니다.",
    icon: Wrench,
    sections: [
      {
        id: "vault",
        title: "금고와 답변이 열리지 않을 때",
        checks: [
          "해당 폼을 만든 계정으로 로그인했는지 확인합니다.",
          "복구 비밀번호와 키 백업 파일을 혼동하지 않았는지 확인합니다.",
          "금고를 열기 전에는 답변 원문과 버전 기록이 보이지 않는 것이 정상입니다.",
          "복구 비밀번호와 백업을 모두 잃었다면 Cokform이 대신 복호화할 수 없습니다.",
        ],
      },
      {
        id: "submit",
        title: "응답 제출·공유 링크 문제",
        table: {
          headers: ["증상", "우선 확인", "다음 조치"],
          rows: [
            ["제출 버튼이 비활성", "필수 질문, 동의 질문, 응답 시작·마감 상태", "미리보기 또는 시크릿 창에서 실제 공개 링크를 점검"],
            ["응답을 받지 못함", "작성자 계정, 답변 탭, 금고 잠금 여부", "복구 비밀번호로 금고를 연 뒤 다시 확인"],
            ["링크가 마감 화면", "수동 마감, 시작·마감 시각", "운영 탭에서 응답 재개 또는 일정 수정"],
            ["파일이 내려받아지지 않음", "브라우저 다운로드 차단, 저장 공간", "다른 형식으로 한 번 시도하고 다운로드 허용 설정 확인"],
          ],
        },
      },
      {
        id: "support",
        title: "문의 전 정리할 정보",
        paragraphs: [
          "문의에는 발생 시각, 폼 제목 또는 URL, 사용한 기능, 브라우저·기기 정보, 보이는 오류 문구만 정리하세요. 복구 비밀번호, 키 백업 파일, 전체 복구 번들, 응답 원문은 어떤 경우에도 보내지 마세요.",
        ],
      },
    ],
    related: [
      ["자주 묻는 질문", "/faq"],
      ["개인키 금고와 복구", "/docs/e2ee-and-key-management"],
      ["응답 운영과 내보내기", "/docs/responses-and-exports"],
    ],
  },
  "brand-guide": {
    eyebrow: "브랜드 리소스",
    title: "브랜드 리소스 사용 가이드",
    description: "콕폼의 로고·심볼·색상을 정확하고 일관되게 쓰기 위한 사용 가이드입니다. 모든 자산은 콕폼 사이트에서 직접 내려받을 수 있습니다.",
    icon: Palette,
    sections: [
      {
        id: "assets",
        title: "공식 자산 선택",
        table: {
          headers: ["자산", "권장 환경", "사용 기준"],
          rows: [
            ["기본 로고", "문서, 웹 화면, 소개 자료, 밝은 배경", "심볼과 워드마크 비율을 유지한 공식 원본을 사용합니다."],
            ["심볼 마크", "앱 아이콘, 프로필, 좁은 영역", "워드마크를 넣기 어려운 경우에만 단독 사용합니다."],
            ["SVG·PDF", "인쇄물, 편집 프로그램, 큰 화면", "확대해도 깨지지 않는 벡터 파일입니다."],
            ["PNG", "투명 배경이 필요한 웹·디자인 작업", "웹·고화질·인쇄용 해상도를 목적에 맞게 선택합니다."],
            ["JPG", "밝은 배경의 문서, 일반 업로드", "밝은 Warm White 배경이 포함된 래스터 파일입니다."],
          ],
        },
      },
      {
        id: "quality",
        title: "형식과 해상도",
        paragraphs: [
          "기본 로고는 PNG·JPG 기준 1024px, 2048px, 4096px를 제공하며, 심볼 마크는 512px, 1024px, 2048px를 제공합니다. 상세 해상도 선택과 파일 다운로드는 브랜드 리소스 센터에서 즉시 할 수 있습니다.",
          "PNG와 JPG는 300 DPI 메타데이터가 포함된 배포 파일입니다. 큰 인쇄물이나 편집 프로그램 작업에서는 해상도 제한이 없는 SVG 또는 PDF를 우선 사용하세요.",
        ],
      },
      {
        id: "principles",
        title: "표기와 사용 원칙",
        checks: [
          "첫 표기는 ‘콕폼(Cokform)’ 또는 문맥에 맞는 ‘콕폼’을 사용합니다.",
          "흰색 또는 충분한 대비가 있는 단색 배경 위에 원본 비율 그대로 사용합니다.",
          "로고의 색상·비율·방향을 바꾸거나, 외곽선·그림자·그라데이션을 임의로 추가하지 않습니다.",
          "Cokform의 파트너십·승인·보증이 있는 것처럼 보이게 사용하지 않습니다.",
          "‘완벽한 보안’, ‘해킹 불가’ 같은 절대적 보장 표현 대신 검증 가능한 제품 설명을 사용합니다.",
        ],
      },
      {
        id: "contact",
        title: "내부 리소스와 문의",
        paragraphs: [
          "공식 파일은 브랜드 리소스 센터에서만 선택 다운로드합니다. 제휴·언론 소개 또는 사용 가능 여부가 필요한 경우에는 Cokform 문의 경로를 이용하세요.",
        ],
        links: [["브랜드 리소스 센터 열기", "/resources"], ["서비스 이용제한 정책", "/service-restrictions"]],
      },
    ],
    related: [
      ["브랜드 리소스 센터", "/resources"],
      ["서비스 이용제한 정책", "/service-restrictions"],
      ["Cokform 문서 홈", "/docs"],
    ],
  },
};

function Section({ section }) {
  return (
    <section id={section.id} className="scroll-mt-8">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 size={18} className="text-[#17866D]" />
        <h2 className="text-xl font-bold tracking-[-0.04em]">{section.title}</h2>
      </div>
      <DocumentCard>
        {section.paragraphs?.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-[#59645E] [&+p]:mt-4">{paragraph}</p>)}
        {section.table && (
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full border-collapse text-left text-sm">
              <thead><tr className="border-b border-[#DDE1D9] text-[#0B4D3D]">{section.table.headers.map((header) => <th key={header} className="px-3 py-3 font-semibold first:pl-0 last:pr-0">{header}</th>)}</tr></thead>
              <tbody>{section.table.rows.map((row) => <tr key={row[0]} className="border-b border-[#EEF0EA] last:border-0">{row.map((cell, index) => <td key={cell} className="px-3 py-3 align-top leading-6 text-[#59645E] first:pl-0 first:font-medium first:text-[#17251F] last:pr-0">{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        {section.checks && <ul className="space-y-3">{section.checks.map((check) => <li key={check} className="flex gap-2.5 text-sm leading-6 text-[#59645E]"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[#17866D]" />{check}</li>)}</ul>}
        {section.links && <div className="mt-5 flex flex-wrap gap-2">{section.links.map(([label, href]) => <a key={href} href={href} className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF6EF] px-3.5 py-2 text-xs font-semibold text-[#0B4D3D] transition hover:bg-[#D8F5E8]">{label} <ArrowRight size={13} /></a>)}</div>}
      </DocumentCard>
    </section>
  );
}

export default function DocsDetailPage({ slug, onBack }) {
  const guide = guides[slug] || guides["brand-guide"];

  useEffect(() => {
    document.title = `${guide.title} | Cokform 문서`;
  }, [guide.title]);

  const navItems = guide.sections.map((section) => ({ href: `#${section.id}`, label: section.title }));

  return (
    <PublicPageShell eyebrow={guide.eyebrow} title={guide.title} description={guide.description} icon={guide.icon} onBack={onBack} backHref="/docs" backLabel="사용 가이드로" aside={<AnchorNav items={navItems} />}>
      {guide.sections.map((section) => <Section key={section.id} section={section} />)}
      <section className="scroll-mt-8 border-t border-[#DDE1D9] pt-6">
        <h2 className="text-xl font-bold tracking-[-0.04em]">함께 보면 좋은 안내</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">{guide.related.map(([label, href]) => <a key={href} href={href} className="group rounded-xl border border-[#DDE1D9] bg-[#FFFDF8] p-4 text-sm font-semibold text-[#0B4D3D] transition hover:border-[#B7DCC8] hover:bg-[#F1FAF4]">{label}<span className="mt-2 flex items-center gap-1 text-xs text-[#59645E]">내용 보기 <ArrowRight size={13} /></span></a>)}</div>
      </section>
    </PublicPageShell>
  );
}
