import { useState } from "react";
import { Check, Mail } from "lucide-react";
import QuestionField from "./QuestionField";
import TurnstileChallenge from "./TurnstileChallenge";
import { sanitizeImageSource, sanitizeRichText } from "../lib/sanitizeRichText";
import { ELEV1, ELEV1_HOVER, MD } from "../theme";

export default function PreviewForm({ form, onSubmit, accent }) {
  const color = accent || MD.primary;
  const descriptionImageSrc = sanitizeImageSource(form.descriptionImage?.src);
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [securityToken, setSecurityToken] = useState("");
  const [securityReset, setSecurityReset] = useState(0);

  const handleChange = (qid, value) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setErrors((e) => ({ ...e, [qid]: false }));
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    let hasError = false;

    if (form.settings?.collectEmail) {
      const email = String(answers._cokform_email || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        nextErrors._cokform_email = true;
        hasError = true;
      }
    }

    form.questions.forEach((q) => {
      if (q.type === "privacy_notice") return; // 안내 전용, 응답값 없음

      if (q.type === "privacy_consent") {
        const v = answers[q.id];
        if (!v) {
          nextErrors[q.id] = true;
          hasError = true;
          return;
        }
        const declineOption = q.options[1];
        if (q.blockOnDecline && v === declineOption) {
          nextErrors[q.id] = "decline";
          hasError = true;
        }
        return;
      }

      if (!q.required) return;
      const v = answers[q.id];
      const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
      if (empty) {
        nextErrors[q.id] = true;
        hasError = true;
      }
    });

    if (!securityToken) {
      nextErrors._security = "보안 확인을 완료한 뒤 제출할 수 있어요.";
      hasError = true;
    }

    setErrors(nextErrors);
    if (hasError) return;

    setSubmitting(true);
    try {
      const completed = await onSubmit(answers, securityToken);
      if (completed !== false) setSubmitted(true);
    } finally {
      // Turnstile tokens are single-use. Always request a new one after a
      // submission attempt, including a transient network failure.
      setSecurityReset((value) => value + 1);
      setSubmitting(false);
    }
  };

  const restart = () => {
    setAnswers({});
    setErrors({});
    setSubmitted(false);
  };

  if (submitted) {
    return (
      <div className={`rounded-xl bg-white p-8 text-center sm:p-10 ${ELEV1}`}>
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}1F`, color }}
        >
          <Check size={22} />
        </div>
        <div className="text-[15px] font-medium text-[#17251F]">응답이 저장되었습니다</div>
        <button onClick={restart} className="mt-4 text-sm font-medium hover:underline" style={{ color }}>
          다른 응답 제출하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border-t-8 bg-white p-5 sm:p-6 ${ELEV1}`} style={{ borderTopColor: color }}>
        <h1 className="break-words text-xl font-normal text-[#17251F] sm:text-2xl">{form.title}</h1>
        {form.description && (
          <p
            className="mt-2 whitespace-pre-wrap text-sm text-[#59645E]"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(form.description) }}
          />
        )}
        {descriptionImageSrc && (
          <img
            src={descriptionImageSrc}
            alt={form.descriptionImage.alt || "설명 이미지"}
            className="mt-4 max-h-72 w-full rounded-lg object-cover"
          />
        )}
      </div>
      {form.settings?.privacyNotice && (
        <div className="rounded-xl border border-[#B7DCC8] bg-[#F1FAF4] p-4 text-sm leading-6 text-[#355C45]" role="note">
          <div className="font-semibold text-[#0B4D3D]">개인정보 수집 안내</div>
          <p className="mt-1">
            이 폼은 <strong>{form.settings.privacyPurpose || "설문 응답 접수 및 결과 분석"}</strong>을 위해 개인정보를 수집할 수 있습니다.
            {form.settings.privacyItems ? ` 수집 항목은 ${form.settings.privacyItems}입니다.` : " 수집 항목과 입력 내용은 응답 전에 확인해 주세요."}
            {` 응답 데이터는 ${form.settings.retentionDays ?? 180}일간 보관 후 파기됩니다.`}
            {" 동의를 거부할 수 있으며, 거부 시 개인정보 수집이 필요한 응답 제출이 제한될 수 있습니다."}
            {form.settings.privacyThirdParty
              ? ` 제3자 제공: ${form.settings.privacyThirdPartyDetails || "제공 관련 세부 안내를 폼 작성자에게 확인해 주세요."}`
              : " 제3자 제공은 별도 동의 없이 진행하지 않습니다."}
            {form.settings.privacyOutsourcing
              ? ` 처리 위탁: ${form.settings.privacyOutsourcingDetails || "위탁 관련 세부 안내를 폼 작성자에게 확인해 주세요."}`
              : " 처리 위탁은 현재 설정되지 않았습니다."}
          </p>
          <a href="/privacy" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-[#0B4D3D] underline underline-offset-2">콕폼 개인정보처리방침 보기</a>
        </div>
      )}
      {form.settings?.collectEmail && (
        <section className="overflow-hidden rounded-xl border border-[#B7DCC8] bg-white" aria-labelledby="email-record-title">
          <div className="flex items-start gap-3 border-b border-[#CDE9D8] bg-[#F1FAF4] px-5 py-4 sm:px-6">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D8F5E8] text-[#0B4D3D]"><Mail size={16} /></span>
            <div>
              <div id="email-record-title" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#0B4D3D]">이 양식은 이메일 주소를 기록합니다 <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-[#0B4D3D] ring-1 ring-[#B7DCC8]">필수</span></div>
              <p className="mt-1 text-xs leading-5 text-[#355C45]">제출한 이메일 주소는 응답과 함께 기록되며, 폼 작성자만 암호화된 응답에서 확인할 수 있어요.</p>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <label htmlFor="cokform-email" className="flex items-center gap-2 text-sm font-medium text-[#17251F]"><Mail size={16} className="text-[#17866D]" /> 이메일 주소</label>
            <input id="cokform-email" type="email" required autoComplete="email" value={answers._cokform_email || ""} onChange={(e) => handleChange("_cokform_email", e.target.value)} placeholder="you@example.com" className={`mt-3 w-full rounded-lg border bg-[#FFFDF8] px-3 py-3 text-base outline-none focus:border-[#17866D] focus:ring-4 focus:ring-[#D8F5E8] ${errors._cokform_email ? "border-[#B3261E]" : "border-[#C9CEC6]"}`} />
            {errors._cokform_email && <div className="mt-1 text-xs text-[#B3261E]">유효한 이메일 주소를 입력해주세요.</div>}
            {form.settings?.responseReceipt && <label className="mt-3 flex items-center gap-2 text-xs text-[#59645E]"><input type="checkbox" checked={Boolean(answers._cokform_receipt)} onChange={(e) => handleChange("_cokform_receipt", e.target.checked)} /> 제출 후 내 응답 사본 받기</label>}
          </div>
        </section>
      )}
      {Object.keys(errors).length > 0 && (
        <div role="alert" className="rounded-xl border border-[#F2B8B5] bg-[#FFF6F5] px-4 py-3 text-sm text-[#8C1D18]">
          {errors._security || "필수 항목과 입력 형식을 다시 확인해주세요."}
        </div>
      )}
      {form.questions.map((q) => (
        <QuestionField key={q.id} q={q} value={answers[q.id]} error={errors[q.id]} onChange={handleChange} />
      ))}
      <TurnstileChallenge onToken={setSecurityToken} resetSignal={securityReset} />
      <div className="sticky bottom-0 z-10 -mx-3 bg-gradient-to-t from-[#F5F3EC] via-[#F5F3EC]/95 to-transparent px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-5 sm:static sm:mx-0 sm:bg-none sm:p-0">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={`min-h-[48px] w-full rounded-full px-6 py-3 text-base font-semibold text-white transition-shadow active:shadow-none disabled:cursor-wait disabled:opacity-60 sm:min-h-0 sm:w-auto sm:py-2.5 sm:text-sm ${ELEV1_HOVER}`}
          style={{ backgroundColor: color }}
        >
          {submitting ? "저장하는 중…" : "제출"}
        </button>
      </div>
    </div>
  );
}
