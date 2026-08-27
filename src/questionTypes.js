export const QUESTION_TYPES = [
  { value: "short", label: "단답형" },
  { value: "paragraph", label: "장문형" },
  { value: "radio", label: "객관식 질문" },
  { value: "checkbox", label: "체크박스" },
  { value: "dropdown", label: "드롭다운" },
  { value: "scale", label: "선형 배율" },
  { value: "date", label: "날짜" },
  { value: "time", label: "시간" },
  { value: "section", label: "섹션 제목" },
];

export const PRIVACY_TYPES = [
  { value: "privacy_consent", label: "개인정보 수집·이용 동의" },
  { value: "privacy_notice", label: "개인정보 수집·위탁 안내" },
];

export const ALL_TYPES = [...QUESTION_TYPES, ...PRIVACY_TYPES];

export const TYPE_LABEL = Object.fromEntries(ALL_TYPES.map((t) => [t.value, t.label]));

// Form IDs end up in public URLs and respondent identifiers. They must be
// unpredictable, never merely unique. Cokform already requires Web Crypto for E2EE,
// so an insecure Math.random fallback would only weaken otherwise protected forms.
export function uid() {
  if (typeof crypto === "undefined" || typeof crypto.getRandomValues !== "function") {
    throw new Error("이 브라우저는 안전한 난수 생성을 지원하지 않습니다.");
  }
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function defaultQuestion(type = "short") {
  const base = { id: uid(), type, title: "", required: false };

  if (type === "radio" || type === "checkbox" || type === "dropdown") {
    return { ...base, options: ["옵션 1"] };
  }
  if (type === "scale") {
    return { ...base, scaleMin: 1, scaleMax: 5, scaleMinLabel: "", scaleMaxLabel: "" };
  }
  if (type === "section") {
    return { ...base, title: "새 섹션", description: "이 섹션에서 받을 내용을 안내하세요.", descriptionFormat: "plain", required: false };
  }
  if (type === "privacy_consent") {
    return {
      ...base,
      title: "개인정보 수집 및 이용에 동의하십니까?",
      purpose: "설문 응답 접수 및 결과 분석",
      items: "이름, 연락처, 응답 내용",
      retention: "설문 종료 후 6개월간 보관 후 파기",
      refusalRights: "동의를 거부할 수 있으나, 동의하지 않으면 개인정보 수집이 필요한 이 설문을 제출할 수 없습니다.",
      options: ["동의합니다", "동의하지 않습니다"],
      blockOnDecline: true,
      required: true,
    };
  }
  if (type === "privacy_notice") {
    return {
      ...base,
      noticeType: "collection",
      title: "개인정보 수집 및 이용 안내",
      content:
        "본 설문은 아래와 같이 개인정보를 수집·이용합니다. 별도 동의 없이 안내 목적으로만 제공됩니다.",
    };
  }
  return base;
}

export function emptyForm() {
  return {
    title: "제목 없는 설문지",
    description: "",
    descriptionFormat: "rich",
    descriptionStyle: {
      fontFamily: "sans",
      fontWeight: "400",
      textAlign: "left",
      imageAlign: "center",
      imageWidth: "full",
      imagePlacement: "below",
    },
    descriptionImage: null,
    questions: [defaultQuestion("radio")],
    accentColor: null, // null = 기본 M3 퍼플
    backgroundColor: null, // null = 기본 페이지 배경
    starred: false,
    settings: {
      collectEmail: false,
      responseReceipt: false,
      ownerResponseNotification: false,
      limitOneResponse: false,
      // 응답 본문은 E2EE로 전송하기 전에 브라우저에서만 검사한다.
      blacklistWords: [],
      blacklistScope: "all",
      publicSlug: "",
      maxResponses: null,
      responsePassword: null,
      allowResponseEdit: false,
      acceptingResponses: true,
      retentionDays: 180,
      privacyNotice: false,
      privacyPurpose: "설문 응답 접수 및 결과 분석",
      privacyItems: "",
      privacyThirdParty: false,
      privacyThirdPartyDetails: "",
      privacyOutsourcing: false,
      privacyOutsourcingDetails: "",
    },
    collaborators: [],
  };
}
