import { richTextToPlain } from "./sanitizeRichText";

const RULES = {
  identifier: ["주민등록", "주민 번호", "주민번호", "여권번호", "여권 번호", "운전면허", "외국인등록", "외국인 등록"],
  sensitive: ["건강", "질병", "병력", "장애", "진단", "종교", "신앙", "정치", "정당", "노동조합", "노조", "성생활", "성적 지향", "성별정체성"],
  personal: ["이름", "성명", "연락처", "전화", "휴대폰", "핸드폰", "이메일", "e-mail", "주소", "생년월일", "생일", "계좌", "카드번호", "직장", "학교", "사진"],
};

function plain(value) {
  return richTextToPlain(String(value || "")).replace(/\s+/g, " ").trim();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function signal(level, code, message, questionId) {
  return { level, code, message, questionId: questionId || null };
}

/**
 * Heuristic guardrail only: it inspects form labels, never responses. It is
 * intentionally conservative and must not be treated as a legal determination.
 */
export function analyzePrivacyRisk(form) {
  const settings = form?.settings || {};
  const questions = Array.isArray(form?.questions) ? form.questions : [];
  const signals = [];
  let asksForPersonalData = Boolean(settings.collectEmail);

  questions.forEach((question) => {
    if (["privacy_consent", "privacy_notice"].includes(question.type)) return;
    const text = plain(`${question.title || ""} ${(question.options || []).join(" ")}`);
    if (!text) return;

    if (includesAny(text, RULES.identifier)) {
      asksForPersonalData = true;
      signals.push(signal("block", "identifier", "주민등록번호·여권번호·운전면허번호 등 고유식별정보로 보이는 질문이 있어요. 법령상 근거와 별도 동의·강화 보호조치를 확인하기 전에는 공개 공유를 막습니다.", question.id));
      return;
    }
    if (includesAny(text, RULES.sensitive)) {
      asksForPersonalData = true;
      signals.push(signal("block", "sensitive", "건강·종교·정치 성향 등 민감정보로 보이는 질문이 있어요. 다른 개인정보 동의와 분리된 별도 동의와 수집 필요성 검토가 필요합니다.", question.id));
      return;
    }
    if (includesAny(text, RULES.personal)) {
      asksForPersonalData = true;
      signals.push(signal("warn", "personal", "개인정보를 수집할 수 있는 질문이 감지됐어요. 목적·항목·보유기간·거부권을 실제 운영 내용에 맞게 확인하세요.", question.id));
    }
  });

  const noticesComplete = Boolean(
    settings.privacyNotice
      && plain(settings.privacyPurpose)
      && plain(settings.privacyItems)
      && Number(settings.retentionDays) > 0
  );
  const collectionConsents = questions.filter((question) => question.type === "privacy_consent");

  if (asksForPersonalData && !noticesComplete) {
    signals.push(signal("warn", "notice_missing", "개인정보 가능 항목이 있지만 수집 목적·항목·보유기간을 갖춘 안내가 완성되지 않았어요."));
  }
  if (asksForPersonalData && collectionConsents.length === 0) {
    signals.push(signal("warn", "consent_missing", "개인정보 가능 항목이 있지만 명시적 수집·이용 동의 질문이 없어요."));
  }

  collectionConsents.forEach((question) => {
    if (![question.purpose, question.items, question.retention, question.refusalRights].every((value) => plain(value))) {
      signals.push(signal("warn", "consent_incomplete", "개인정보 동의 질문에 목적·항목·보유기간·동의 거부 안내를 모두 작성하세요.", question.id));
    }
  });

  if (settings.privacyThirdParty && !plain(settings.privacyThirdPartyDetails)) {
    signals.push(signal("warn", "third_party_incomplete", "제3자 제공을 표시했다면 제공받는 자·목적·항목·보유기간·거부권을 구체적으로 작성하세요."));
  }
  if (settings.privacyOutsourcing && !plain(settings.privacyOutsourcingDetails)) {
    signals.push(signal("warn", "outsourcing_incomplete", "처리 위탁을 표시했다면 수탁자와 위탁 업무 내용을 구체적으로 작성하세요."));
  }

  return {
    signals,
    blocking: signals.filter((item) => item.level === "block"),
    warnings: signals.filter((item) => item.level === "warn"),
    asksForPersonalData,
    noticesComplete,
  };
}

export const PRIVACY_AUDIT_LEVEL = {
  block: { label: "공개 공유 전 확인 필요", color: "#B3261E", background: "#FFF0EE" },
  warn: { label: "고지 확인 필요", color: "#8A5A00", background: "#FFF8DE" },
};
