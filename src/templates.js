import { defaultQuestion } from "./questionTypes";

function q(type, overrides = {}) {
  return { ...defaultQuestion(type), ...overrides };
}

function privacyQuestions() {
  return [q("privacy_notice"), q("privacy_consent")];
}

// 로그인 직후 바로 쓰는 한국 실무형 양식. 개인정보가 기본으로 들어가는 흐름에는
// 안내와 동의 질문을 함께 넣어, 운영자가 실제 수집 목적·보유기간을 확인하고 채울 수 있게 한다.
export const TEMPLATES = [
  {
    key: "blank",
    label: "빈 양식",
    blank: true,
    segment: "직접 만들기",
    build: () => ({
      title: "제목 없는 설문지",
      description: "",
      questions: [defaultQuestion("radio")],
    }),
  },
  {
    key: "consultation_request",
    label: "상담·문의 접수",
    segment: "고객 응대",
    build: () => ({
      title: "상담·문의 접수",
      description: "상담에 필요한 내용을 남겨주세요. 확인 후 안내드리겠습니다.",
      questions: [
        q("short", { title: "이름 또는 담당자명", required: true }),
        q("short", { title: "연락처 또는 이메일", required: true }),
        q("dropdown", { title: "문의 분야", required: true, options: ["상품·서비스 문의", "이용 방법 문의", "제휴·협업 문의", "기타 문의"] }),
        q("paragraph", { title: "문의 내용", required: true }),
        ...privacyQuestions(),
      ],
    }),
  },
  {
    key: "reservation_request",
    label: "예약 신청",
    segment: "예약·방문",
    build: () => ({
      title: "예약 신청",
      description: "희망 일정과 요청 사항을 남겨주세요. 예약 가능 여부를 확인해 안내드립니다.",
      questions: [
        q("short", { title: "예약자 이름", required: true }),
        q("short", { title: "연락처", required: true }),
        q("date", { title: "희망 날짜", required: true }),
        q("time", { title: "희망 시간" }),
        q("dropdown", { title: "인원", required: true, options: ["1명", "2명", "3~4명", "5~9명", "10명 이상"] }),
        q("paragraph", { title: "요청 사항" }),
        ...privacyQuestions(),
      ],
    }),
  },
  {
    key: "program_application",
    label: "교육·행사 참가 신청",
    segment: "신청·접수",
    build: () => ({
      title: "교육·행사 참가 신청",
      description: "참가에 필요한 내용을 작성해 주세요. 신청 결과와 안내는 입력한 연락 방법으로 전달됩니다.",
      questions: [
        q("short", { title: "이름", required: true }),
        q("short", { title: "소속 또는 회사명" }),
        q("short", { title: "이메일", required: true }),
        q("short", { title: "연락처" }),
        q("checkbox", { title: "참가를 원하는 프로그램", required: true, options: ["기본 세션", "심화 세션", "네트워킹", "자료만 수령"] }),
        q("radio", { title: "참가 방식", required: true, options: ["현장 참가", "온라인 참가", "미정"] }),
        ...privacyQuestions(),
      ],
    }),
  },
  {
    key: "attendance_check",
    label: "출결·참석 확인",
    segment: "운영 관리",
    build: () => ({
      title: "출결·참석 확인",
      description: "참석 여부를 확인해 주세요. 불참 또는 지각 예정인 경우 사유를 함께 남길 수 있습니다.",
      questions: [
        q("short", { title: "이름", required: true }),
        q("short", { title: "소속 또는 반·팀" }),
        q("radio", { title: "참석 여부", required: true, options: ["참석", "지각 예정", "불참"] }),
        q("paragraph", { title: "불참·지각 사유 또는 전달 사항" }),
        ...privacyQuestions(),
      ],
    }),
  },
  {
    key: "quote_request",
    label: "견적 요청",
    segment: "영업·제휴",
    build: () => ({
      title: "견적 요청",
      description: "필요한 항목과 규모를 남겨주세요. 확인 후 견적 또는 상담 안내를 드리겠습니다.",
      questions: [
        q("short", { title: "회사명 또는 상호" }),
        q("short", { title: "담당자명", required: true }),
        q("short", { title: "이메일", required: true }),
        q("short", { title: "연락처" }),
        q("checkbox", { title: "관심 항목", required: true, options: ["서비스 도입", "단체·기업 이용", "제휴·협업", "기타"] }),
        q("dropdown", { title: "예상 규모", options: ["1~9명", "10~49명", "50~99명", "100명 이상", "상담 후 결정"] }),
        q("paragraph", { title: "요청 내용", required: true }),
        ...privacyQuestions(),
      ],
    }),
  },
];

// PRO 템플릿은 파일럿 동안 무료 공개한다. 실제 개인정보 수집 흐름은 안내·동의 질문을
// 포함하지만, 수집 목적·항목·보유기간은 각 운영자가 자신의 업무에 맞게 검토·수정해야 한다.
export const PREMIUM_TEMPLATES = [
  {
    key: "job_application",
    label: "채용 지원서",
    tier: "premium",
    segment: "인사·채용",
    build: () => ({
      title: "채용 지원서",
      description: "지원 분야와 연락처를 작성해 주세요. 제출한 정보는 채용 검토 목적으로만 사용됩니다.",
      questions: [
        q("short", { title: "이름", required: true }),
        q("short", { title: "연락처", required: true }),
        q("short", { title: "이메일", required: true }),
        q("dropdown", { title: "지원 직무", required: true, options: ["기획", "디자인", "개발", "마케팅·영업", "운영", "기타"] }),
        q("paragraph", { title: "자기소개 및 지원 동기", required: true }),
        ...privacyQuestions(),
      ],
    }),
  },
  {
    key: "customer_satisfaction",
    label: "고객 만족도 조사",
    tier: "premium",
    segment: "고객 경험",
    build: () => ({
      title: "고객 만족도 조사",
      description: "더 나은 서비스를 위해 소중한 의견을 들려주세요. 개인을 식별하지 않는 방식으로도 운영할 수 있습니다.",
      questions: [
        q("scale", { title: "전반적인 만족도를 평가해 주세요", required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "매우 불만족", scaleMaxLabel: "매우 만족" }),
        q("radio", { title: "주변에 추천할 의향이 있으신가요?", required: true, options: ["매우 그렇다", "그렇다", "보통", "아니다", "전혀 아니다"] }),
        q("checkbox", { title: "개선이 필요하다고 느낀 부분", options: ["이용 편의성", "안내·응대", "가격·혜택", "품질", "기타"] }),
        q("paragraph", { title: "개선이 필요한 부분이 있다면 알려주세요" }),
      ],
    }),
  },
  {
    key: "privacy_agreement",
    label: "개인정보 수집·이용 동의",
    tier: "premium",
    segment: "동의·고지",
    build: () => ({
      title: "개인정보 수집·이용 동의",
      description: "수집 목적·항목·보유기간을 실제 운영 내용에 맞게 확인하고 작성해 주세요.",
      questions: [...privacyQuestions()],
    }),
  },
  {
    key: "education_feedback",
    label: "교육·행사 만족도",
    tier: "premium",
    segment: "교육 운영",
    build: () => ({
      title: "교육·행사 만족도 조사",
      description: "다음 교육과 행사를 더 좋게 만들 수 있도록 의견을 남겨주세요.",
      questions: [
        q("dropdown", { title: "참여한 프로그램", required: true, options: ["교육", "세미나", "워크숍", "행사", "기타"] }),
        q("scale", { title: "내용 구성은 얼마나 만족스러웠나요?", required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "매우 아쉬움", scaleMaxLabel: "매우 만족" }),
        q("scale", { title: "진행과 안내는 얼마나 만족스러웠나요?", required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "매우 아쉬움", scaleMaxLabel: "매우 만족" }),
        q("paragraph", { title: "다음에 다뤘으면 하는 주제 또는 개선점" }),
      ],
    }),
  },
  {
    key: "internal_feedback",
    label: "사내 의견 수렴",
    tier: "premium",
    segment: "조직 운영",
    build: () => ({
      title: "사내 의견 수렴",
      description: "개선에 필요한 의견을 자유롭게 남겨주세요. 익명 운영이 필요하면 식별 질문을 추가하지 마세요.",
      questions: [
        q("dropdown", { title: "소속 부서", options: ["기획", "개발", "디자인", "마케팅·영업", "운영", "기타"] }),
        q("scale", { title: "현재 업무 환경에 얼마나 만족하시나요?", required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "매우 불만족", scaleMaxLabel: "매우 만족" }),
        q("radio", { title: "우선 개선이 필요한 영역", options: ["업무 도구", "협업 방식", "복지·문화", "업무량", "소통", "기타"] }),
        q("paragraph", { title: "개선했으면 하는 점을 자유롭게 적어주세요" }),
      ],
    }),
  },
  {
    key: "group_order",
    label: "단체 주문·수요 조사",
    tier: "premium",
    segment: "주문·수요",
    build: () => ({
      title: "단체 주문·수요 조사",
      description: "희망 품목과 수량을 남겨주세요. 최종 주문 확정 전 별도 안내를 드립니다.",
      questions: [
        q("short", { title: "이름", required: true }),
        q("short", { title: "연락처 또는 이메일", required: true }),
        q("checkbox", { title: "희망 품목", required: true, options: ["품목 A", "품목 B", "품목 C", "기타"] }),
        q("short", { title: "희망 수량", required: true }),
        q("paragraph", { title: "색상·규격 등 요청 사항" }),
        ...privacyQuestions(),
      ],
    }),
  },
];
