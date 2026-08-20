import { defaultQuestion } from "./questionTypes";

function q(type, overrides = {}) {
  return { ...defaultQuestion(type), ...overrides };
}

function section(title, description) {
  return q("section", { title, description });
}

function privacyQuestions({ purpose, items, retention = "접수 및 처리 완료 후 180일", refusalRights } = {}) {
  const resolvedPurpose = purpose || "설문 응답 접수 및 결과 분석";
  const resolvedItems = items || "이름, 연락처, 응답 내용";
  const resolvedRefusalRights = refusalRights || "동의를 거부할 수 있으나, 동의하지 않으면 개인정보 수집이 필요한 접수 처리가 제한될 수 있습니다.";
  return [
    q("privacy_notice", {
      title: "개인정보 수집·이용 안내",
      content: `수집 목적: ${resolvedPurpose}\n수집 항목: ${resolvedItems}\n보유 기간: ${retention}\n※ 실제 업무에 맞는 수집 목적·항목·보유 기간인지 반드시 확인하고 수정해 주세요.`,
    }),
    q("privacy_consent", { purpose: resolvedPurpose, items: resolvedItems, retention, refusalRights: resolvedRefusalRights }),
  ];
}

function privacySettings({ purpose, items, retention = "접수 및 처리 완료 후 180일" }) {
  return {
    privacyNotice: true,
    privacyPurpose: purpose,
    privacyItems: items,
    retentionDays: 180,
    privacyTemplateRetention: retention,
  };
}

// 로그인 후 바로 사용할 수 있는 한국 실무형 양식입니다. 개인정보를 받는
// 템플릿은 목적·항목·보유 기간을 각각 명시하지만, 배포 전 실제 운영 내용에
// 맞게 작성자가 반드시 수정하도록 안내합니다.
export const TEMPLATES = [
  {
    key: "blank",
    label: "빈 양식",
    blank: true,
    segment: "직접 만들기",
    build: () => ({
      title: "제목 없는 양식",
      description: "",
      questions: [],
    }),
  },
  {
    key: "consultation_request",
    label: "상담·문의 접수",
    segment: "고객 응대",
    build: () => {
      const privacy = { purpose: "상담 문의 확인 및 답변", items: "이름 또는 담당자명, 연락처 또는 이메일, 문의 내용", retention: "상담 처리 완료 후 180일" };
      return {
        title: "상담·문의 접수",
        description: "문의 내용을 남겨주시면 확인 후 입력하신 연락 방법으로 안내드리겠습니다.",
        settings: privacySettings(privacy),
        questions: [
          section("연락 정보", "답변을 받을 수 있는 정보를 입력해 주세요."),
          q("short", { title: "이름 또는 담당자명", required: true }),
          q("short", { title: "연락처 또는 이메일", required: true }),
          section("문의 내용", "문의 분야와 필요한 내용을 구체적으로 적어주시면 더 빠르게 안내할 수 있어요."),
          q("dropdown", { title: "문의 분야", required: true, options: ["상품·서비스 문의", "이용 방법 문의", "견적·도입 문의", "제휴·협업 문의", "기타 문의"] }),
          q("paragraph", { title: "문의 내용", required: true }),
          ...privacyQuestions(privacy),
        ],
      };
    },
  },
  {
    key: "reservation_request",
    label: "예약 신청",
    segment: "예약·방문",
    build: () => {
      const privacy = { purpose: "예약 가능 여부 확인 및 일정 안내", items: "예약자 이름, 연락처, 희망 일정, 인원, 요청 사항", retention: "예약 처리 완료 후 180일" };
      return {
        title: "예약 신청",
        description: "희망 일정은 확정이 아닙니다. 예약 가능 여부를 확인한 뒤 안내드리겠습니다.",
        settings: { ...privacySettings(privacy), maxResponses: 100 },
        questions: [
          section("예약자 정보", "예약 확인을 위해 연락 가능한 정보를 입력해 주세요."),
          q("short", { title: "예약자 이름", required: true }),
          q("short", { title: "연락처", required: true }),
          section("희망 일정", "가능한 일정과 인원을 알려주세요."),
          q("date", { title: "희망 날짜", required: true }),
          q("time", { title: "희망 시간", required: true }),
          q("dropdown", { title: "인원", required: true, options: ["1명", "2명", "3~4명", "5~9명", "10명 이상"] }),
          q("paragraph", { title: "요청 사항", required: false }),
          ...privacyQuestions(privacy),
        ],
      };
    },
  },
  {
    key: "program_application",
    label: "교육·행사 참가 신청",
    segment: "신청·접수",
    build: () => {
      const privacy = { purpose: "교육·행사 참가 신청 확인 및 운영 안내", items: "이름, 소속, 이메일, 연락처, 참가 방식", retention: "행사 종료 후 180일" };
      return {
        title: "교육·행사 참가 신청",
        description: "참가 신청 후 안내는 입력하신 이메일 또는 연락처로 전달됩니다. 프로그램명·정원은 운영 내용에 맞게 수정해 주세요.",
        settings: { ...privacySettings(privacy), collectEmail: true, maxResponses: 100 },
        questions: [
          section("참가자 정보", "참가 확인과 안내를 위해 필요한 정보를 입력해 주세요."),
          q("short", { title: "이름", required: true }),
          q("short", { title: "소속 또는 회사명", required: false }),
          q("short", { title: "연락처", required: false }),
          section("참가 정보", "신청하려는 프로그램과 참가 방식을 선택해 주세요."),
          q("short", { title: "참가 프로그램 또는 회차", required: true }),
          q("radio", { title: "참가 방식", required: true, options: ["현장 참가", "온라인 참가", "자료만 요청"] }),
          q("paragraph", { title: "운영진에게 전달할 사항", required: false }),
          ...privacyQuestions(privacy),
        ],
      };
    },
  },
  {
    key: "attendance_check",
    label: "출결·참석 확인",
    segment: "운영 관리",
    build: () => {
      const privacy = { purpose: "참석 현황 확인 및 운영 안내", items: "이름, 소속 또는 팀, 참석 여부, 전달 사항", retention: "행사 또는 교육 종료 후 90일" };
      return {
        title: "출결·참석 확인",
        description: "참석 여부를 확인해 주세요. 불참 또는 지각 예정인 경우 사유를 함께 남길 수 있습니다.",
        settings: privacySettings(privacy),
        questions: [
          section("참석자 정보", "정확한 출결 확인을 위해 입력해 주세요."),
          q("short", { title: "이름", required: true }),
          q("short", { title: "소속 또는 반·팀", required: false }),
          section("참석 여부", "현재 참석 가능 여부를 선택해 주세요."),
          q("radio", { title: "참석 여부", required: true, options: ["참석", "지각 예정", "불참"] }),
          q("paragraph", { title: "불참·지각 사유 또는 전달 사항", required: false }),
          ...privacyQuestions(privacy),
        ],
      };
    },
  },
  {
    key: "quote_request",
    label: "견적 요청",
    segment: "영업·제휴",
    build: () => {
      const privacy = { purpose: "견적 검토 및 상담 안내", items: "회사명 또는 상호, 담당자명, 이메일, 연락처, 관심 항목, 요청 내용", retention: "견적 처리 완료 후 180일" };
      return {
        title: "견적 요청",
        description: "필요한 항목과 규모를 남겨주세요. 확인 후 견적 또는 상담 일정을 안내드리겠습니다.",
        settings: { ...privacySettings(privacy), collectEmail: true },
        questions: [
          section("담당자 정보", "견적 안내를 받을 담당자 정보를 입력해 주세요."),
          q("short", { title: "회사명 또는 상호", required: false }),
          q("short", { title: "담당자명", required: true }),
          q("short", { title: "연락처", required: false }),
          section("견적 요청 내용", "원하는 항목과 예상 규모를 선택하거나 적어주세요."),
          q("checkbox", { title: "관심 항목", required: true, options: ["서비스 도입", "단체·기업 이용", "제휴·협업", "기타"] }),
          q("dropdown", { title: "예상 규모", required: false, options: ["1~9명", "10~49명", "50~99명", "100명 이상", "상담 후 결정"] }),
          q("date", { title: "견적 회신 희망일", required: false }),
          q("paragraph", { title: "요청 내용", required: true }),
          ...privacyQuestions(privacy),
        ],
      };
    },
  },
];

// 확장 템플릿은 더 긴 실무 흐름을 제공합니다. 개인정보를 포함하는 템플릿은
// 실제 보유 기간과 수집 항목을 반드시 운영 상황에 맞게 재검토해야 합니다.
export const PREMIUM_TEMPLATES = [
  {
    key: "job_application",
    label: "채용 지원서",
    tier: "premium",
    segment: "인사·채용",
    build: () => {
      const privacy = { purpose: "채용 지원 검토 및 채용 절차 안내", items: "이름, 연락처, 이메일, 지원 직무, 자기소개 및 지원 동기", retention: "채용 절차 종료 후 180일" };
      return {
        title: "채용 지원서",
        description: "지원 분야와 연락처를 작성해 주세요. 제출 전 수집 목적·항목·보유 기간이 실제 채용 운영과 맞는지 확인해 주세요.",
        settings: { ...privacySettings(privacy), collectEmail: true },
        questions: [
          section("지원자 정보", "채용 안내를 받을 수 있는 정보를 입력해 주세요."),
          q("short", { title: "이름", required: true }),
          q("short", { title: "연락처", required: true }),
          section("지원 내용", "지원 직무와 간단한 소개를 작성해 주세요."),
          q("dropdown", { title: "지원 직무", required: true, options: ["기획", "디자인", "개발", "마케팅·영업", "운영", "기타"] }),
          q("paragraph", { title: "자기소개 및 지원 동기", required: true }),
          q("paragraph", { title: "경력·포트폴리오 링크 또는 추가 안내", required: false }),
          ...privacyQuestions(privacy),
        ],
      };
    },
  },
  {
    key: "customer_satisfaction",
    label: "고객 만족도 조사",
    tier: "premium",
    segment: "고객 경험",
    build: () => ({
      title: "고객 만족도 조사",
      description: "더 나은 서비스를 위해 소중한 의견을 들려주세요. 익명으로 운영하려면 이름·이메일 같은 식별 질문을 추가하지 마세요.",
      questions: [
        section("서비스 경험", "최근 이용 경험을 기준으로 답변해 주세요."),
        q("scale", { title: "전반적인 만족도를 평가해 주세요", required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "매우 불만족", scaleMaxLabel: "매우 만족" }),
        q("radio", { title: "주변에 추천할 의향이 있으신가요?", required: true, options: ["매우 그렇다", "그렇다", "보통", "아니다", "전혀 아니다"] }),
        q("checkbox", { title: "개선이 필요하다고 느낀 부분", required: false, options: ["이용 편의성", "안내·응대", "가격·혜택", "품질", "기타"] }),
        q("paragraph", { title: "개선이 필요한 부분이 있다면 알려주세요", required: false }),
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
      description: "수집 목적·항목·보유 기간을 실제 운영 내용에 맞게 수정한 뒤 사용해 주세요.",
      settings: privacySettings({ purpose: "서비스 신청 및 운영 안내", items: "이름, 연락처 또는 이메일, 신청 내용", retention: "목적 달성 후 180일" }),
      questions: [section("개인정보 처리 안내", "아래 내용을 실제 처리 목적에 맞게 수정해 주세요."), ...privacyQuestions({ purpose: "서비스 신청 및 운영 안내", items: "이름, 연락처 또는 이메일, 신청 내용", retention: "목적 달성 후 180일" })],
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
        section("참여 경험", "참여한 프로그램을 기준으로 평가해 주세요."),
        q("dropdown", { title: "참여한 프로그램", required: true, options: ["교육", "세미나", "워크숍", "행사", "기타"] }),
        q("scale", { title: "내용 구성은 얼마나 만족스러웠나요?", required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "매우 아쉬움", scaleMaxLabel: "매우 만족" }),
        q("scale", { title: "진행과 안내는 얼마나 만족스러웠나요?", required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "매우 아쉬움", scaleMaxLabel: "매우 만족" }),
        q("paragraph", { title: "다음에 다뤘으면 하는 주제 또는 개선점", required: false }),
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
      description: "개선에 필요한 의견을 자유롭게 남겨주세요. 익명 운영이 필요하면 소속·이름·이메일 등의 식별 질문을 추가하지 마세요.",
      questions: [
        section("업무 환경", "익명 운영이 필요하다면 소속 선택도 선택 사항으로 두세요."),
        q("dropdown", { title: "소속 부서", required: false, options: ["기획", "개발", "디자인", "마케팅·영업", "운영", "기타"] }),
        q("scale", { title: "현재 업무 환경에 얼마나 만족하시나요?", required: true, scaleMin: 1, scaleMax: 5, scaleMinLabel: "매우 불만족", scaleMaxLabel: "매우 만족" }),
        q("radio", { title: "우선 개선이 필요한 영역", required: false, options: ["업무 도구", "협업 방식", "복지·문화", "업무량", "소통", "기타"] }),
        q("paragraph", { title: "개선했으면 하는 점을 자유롭게 적어주세요", required: false }),
      ],
    }),
  },
  {
    key: "group_order",
    label: "단체 주문·수요 조사",
    tier: "premium",
    segment: "주문·수요",
    build: () => {
      const privacy = { purpose: "단체 주문 수요 확인 및 주문 안내", items: "이름, 연락처 또는 이메일, 희망 품목, 수량, 요청 사항", retention: "최종 주문 완료 후 180일" };
      return {
        title: "단체 주문·수요 조사",
        description: "희망 품목과 수량을 남겨주세요. 최종 주문 확정 전 별도 안내를 드립니다.",
        settings: { ...privacySettings(privacy), maxResponses: 100 },
        questions: [
          section("신청자 정보", "주문 안내를 받을 수 있는 정보를 입력해 주세요."),
          q("short", { title: "이름", required: true }),
          q("short", { title: "연락처 또는 이메일", required: true }),
          section("수요 정보", "희망 품목과 수량을 적어주세요."),
          q("short", { title: "희망 품목명", required: true }),
          q("short", { title: "희망 수량", required: true }),
          q("radio", { title: "신청 단위", required: false, options: ["개인", "팀·부서", "단체"] }),
          q("paragraph", { title: "색상·규격·납품 등 요청 사항", required: false }),
          ...privacyQuestions(privacy),
        ],
      };
    },
  },
];
