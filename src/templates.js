import { defaultQuestion } from "./questionTypes";

function q(type, overrides = {}) {
  return { ...defaultQuestion(type), ...overrides };
}

export const TEMPLATES = [
  {
    key: "blank",
    label: "빈 양식",
    blank: true,
    build: () => ({
      title: "제목 없는 설문지",
      description: "",
      questions: [defaultQuestion("radio")],
    }),
  },
  {
    key: "contact",
    label: "연락처 정보",
    build: () => ({
      title: "연락처 정보",
      description: "아래 정보를 입력해 주세요.",
      questions: [
        q("short", { title: "이름", required: true }),
        q("short", { title: "이메일", required: true }),
        q("short", { title: "전화번호" }),
        q("paragraph", { title: "주소" }),
      ],
    }),
  },
  {
    key: "event_rsvp",
    label: "행사 참석 여부",
    build: () => ({
      title: "행사 참석 여부",
      description: "참석 가능 여부를 알려주세요.",
      questions: [
        q("radio", {
          title: "참석 가능하신가요?",
          required: true,
          options: ["참석합니다", "참석이 어렵습니다"],
        }),
        q("paragraph", { title: "전달하고 싶은 말씀이 있다면 남겨주세요" }),
      ],
    }),
  },
  {
    key: "party_invite",
    label: "파티 초대",
    build: () => ({
      title: "파티 초대",
      description: "함께해 주실 수 있나요?",
      questions: [
        q("short", { title: "이름", required: true }),
        q("radio", { title: "참석 여부", required: true, options: ["참석할게요", "아쉽지만 못 가요"] }),
        q("short", { title: "동반 인원 수" }),
        q("paragraph", { title: "못 먹는 음식이 있다면 알려주세요" }),
      ],
    }),
  },
  {
    key: "tshirt_order",
    label: "티셔츠 신청",
    build: () => ({
      title: "티셔츠 신청",
      description: "사이즈와 수량을 선택해 주세요.",
      questions: [
        q("short", { title: "이름", required: true }),
        q("dropdown", { title: "사이즈", required: true, options: ["S", "M", "L", "XL", "XXL"] }),
        q("short", { title: "수량", required: true }),
      ],
    }),
  },
  {
    key: "event_registration",
    label: "행사 등록",
    build: () => ({
      title: "행사 등록",
      description: "행사 참가 신청서입니다.",
      questions: [
        q("short", { title: "이름", required: true }),
        q("short", { title: "소속 · 회사" }),
        q("checkbox", { title: "참여하고 싶은 세션", options: ["세션 A", "세션 B", "세션 C"] }),
        q("short", { title: "이메일", required: true }),
      ],
    }),
  },
];

// 기업 · 기관용 — 개인정보 동의/안내 문항이 기본으로 들어가 있어 법적 요건을 바로 충족하는 양식.
// 결제 게이팅은 아직 없음: tier 값은 홈 화면에 PRO 배지를 붙이는 용도로만 쓰인다.
export const PREMIUM_TEMPLATES = [
  {
    key: "job_application",
    label: "채용 지원서",
    tier: "premium",
    segment: "기관",
    build: () => ({
      title: "채용 지원서",
      description: "아래 정보를 빠짐없이 작성해 주세요.",
      questions: [
        q("short", { title: "이름", required: true }),
        q("short", { title: "연락처", required: true }),
        q("short", { title: "지원 직무", required: true }),
        q("paragraph", { title: "자기소개 및 지원 동기", required: true }),
        q("privacy_consent"),
      ],
    }),
  },
  {
    key: "membership_signup",
    label: "회원 가입 신청서",
    tier: "premium",
    segment: "기관",
    build: () => ({
      title: "회원 가입 신청서",
      description: "회원 가입을 위해 아래 내용을 입력해 주세요.",
      questions: [
        q("short", { title: "이름", required: true }),
        q("short", { title: "이메일", required: true }),
        q("short", { title: "연락처" }),
        q("privacy_notice"),
        q("privacy_consent"),
      ],
    }),
  },
  {
    key: "customer_satisfaction",
    label: "고객 만족도 조사",
    tier: "premium",
    segment: "회사",
    build: () => ({
      title: "고객 만족도 조사",
      description: "더 나은 서비스를 위해 소중한 의견을 들려주세요.",
      questions: [
        q("scale", { title: "전반적인 만족도를 평가해 주세요", required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "매우 불만족", scaleMaxLabel: "매우 만족" }),
        q("radio", { title: "주변에 추천할 의향이 있으신가요?", options: ["매우 그렇다", "그렇다", "보통", "아니다", "전혀 아니다"] }),
        q("paragraph", { title: "개선이 필요한 부분이 있다면 알려주세요" }),
      ],
    }),
  },
  {
    key: "privacy_agreement",
    label: "개인정보 처리 동의서",
    tier: "premium",
    segment: "기관",
    build: () => ({
      title: "개인정보 처리 동의서",
      description: "",
      questions: [q("privacy_notice"), q("privacy_consent")],
    }),
  },
  {
    key: "internal_feedback",
    label: "사내 피드백 조사",
    tier: "premium",
    segment: "회사",
    build: () => ({
      title: "사내 피드백 조사",
      description: "익명으로 진행되며, 솔직한 의견 부탁드립니다.",
      questions: [
        q("dropdown", { title: "소속 부서", options: ["기획", "개발", "디자인", "영업", "기타"] }),
        q("scale", { title: "현재 업무 환경에 얼마나 만족하시나요?", scaleMin: 1, scaleMax: 5 }),
        q("paragraph", { title: "개선했으면 하는 점을 자유롭게 적어주세요" }),
      ],
    }),
  },
];
