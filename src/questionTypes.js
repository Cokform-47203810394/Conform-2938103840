export const QUESTION_TYPES = [
  { value: "short", label: "단답형" },
  { value: "paragraph", label: "장문형" },
  { value: "radio", label: "객관식 질문" },
  { value: "checkbox", label: "체크박스" },
  { value: "dropdown", label: "드롭다운" },
  { value: "scale", label: "선형 배율" },
  { value: "date", label: "날짜" },
  { value: "time", label: "시간" },
];

export const PRIVACY_TYPES = [
  { value: "privacy_consent", label: "개인정보 수집·이용 동의" },
  { value: "privacy_notice", label: "개인정보 수집·위탁 안내" },
];

export const ALL_TYPES = [...QUESTION_TYPES, ...PRIVACY_TYPES];

export const TYPE_LABEL = Object.fromEntries(ALL_TYPES.map((t) => [t.value, t.label]));

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function defaultQuestion(type = "short") {
  const base = { id: uid(), type, title: "", required: false };

  if (type === "radio" || type === "checkbox" || type === "dropdown") {
    return { ...base, options: ["옵션 1"] };
  }
  if (type === "scale") {
    return { ...base, scaleMin: 1, scaleMax: 5, scaleMinLabel: "", scaleMaxLabel: "" };
  }
  if (type === "privacy_consent") {
    return {
      ...base,
      title: "개인정보 수집 및 이용에 동의하십니까?",
      purpose: "설문 응답 접수 및 결과 분석",
      items: "이름, 연락처, 응답 내용",
      retention: "설문 종료 후 6개월간 보관 후 파기",
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
    questions: [defaultQuestion("radio")],
    accentColor: null, // null = 기본 M3 퍼플
    backgroundColor: null, // null = 기본 페이지 배경
    starred: false,
    settings: {
      collectEmail: false,
      limitOneResponse: false,
      acceptingResponses: true,
    },
    collaborators: [],
  };
}
