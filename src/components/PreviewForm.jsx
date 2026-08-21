import { useRef, useState } from "react";
import { Check, Mail } from "lucide-react";
import QuestionField from "./QuestionField";
import { ELEV1, ELEV1_HOVER, MD } from "../theme";
import { sanitizeImageSource, sanitizeRichText } from "../lib/sanitizeRichText";
import MarkdownContent from "./MarkdownContent";

function isQuestionVisible(question, answers) {
  const condition = question.visibilityCondition;
  if (!condition?.questionId) return true;
  const sourceValue = answers[condition.questionId];
  return Array.isArray(sourceValue) ? sourceValue.includes(condition.value) : sourceValue === condition.value;
}

export default function PreviewForm({ form, onSubmit, accent, previewMode = false }) {
  const color = accent || MD.primary;
  const descriptionImageSrc = sanitizeImageSource(form.descriptionImage?.src);
  const descriptionStyle = form.descriptionStyle || {};
  const descriptionTypography = {
    fontFamily: descriptionStyle.fontFamily === "serif"
      ? 'Georgia, "Times New Roman", serif'
      : descriptionStyle.fontFamily === "mono"
        ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
        : 'Pretendard Variable, Pretendard, system-ui, sans-serif',
    fontWeight: descriptionStyle.fontWeight || "400",
    textAlign: descriptionStyle.textAlign || "left",
  };
  const descriptionImageWidth = descriptionStyle.imageWidth === "small" ? "max-w-sm" : descriptionStyle.imageWidth === "medium" ? "max-w-xl" : "max-w-none";
  const descriptionImageAlign = descriptionStyle.imageAlign === "left" ? "mr-auto" : descriptionStyle.imageAlign === "right" ? "ml-auto" : "mx-auto";
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [website, setWebsite] = useState("");
  const startedAtRef = useRef(Date.now());
  const errorSummaryRef = useRef(null);

  const handleChange = (qid, value) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setErrors((e) => ({ ...e, [qid]: false }));
  };

  const moveToError = (id) => {
    const target = document.getElementById(`cokform-question-${id}`) || errorSummaryRef.current;
    target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      const field = target?.querySelector?.("input, textarea, select, button, iframe");
      field?.focus?.({ preventScroll: true });
    }, 280);
  };

  const handleSubmit = async () => {
    const nextErrors = {};
    let hasError = false;
    let firstErrorId = "";
    const markError = (id, value = true) => {
      nextErrors[id] = value;
      if (!firstErrorId) firstErrorId = id;
      hasError = true;
    };

    if (form.settings?.collectEmail) {
      const email = String(answers._cokform_email || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        markError("_cokform_email");
      }
    }

    form.questions.forEach((q) => {
      if (q.type === "privacy_notice" || q.type === "section" || !isQuestionVisible(q, answers)) return; // 안내 전용, 응답값 없음

      if (q.type === "privacy_consent") {
        const v = answers[q.id];
        if (!v) {
          markError(q.id);
          return;
        }
        const declineOption = q.options[1];
        if (q.blockOnDecline && v === declineOption) {
          markError(q.id, "decline");
        }
        return;
      }

      if (!q.required) return;
      const v = answers[q.id];
      const empty = v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
      if (empty) {
        markError(q.id);
      }
    });


    setErrors(nextErrors);
    if (hasError) {
      window.requestAnimationFrame(() => moveToError(firstErrorId));
      return;
    }

    setSubmitting(true);
    try {
      const visibleQuestionIds = new Set(form.questions.filter((question) => isQuestionVisible(question, answers)).map((question) => question.id));
      const submittedAnswers = Object.fromEntries(Object.entries(answers).filter(([id]) => id.startsWith("_cokform_") || visibleQuestionIds.has(id)));
      const completed = await onSubmit(submittedAnswers, previewMode ? {} : { startedAt: startedAtRef.current, website });
      if (completed !== false) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const restart = () => {
    setAnswers({});
    setErrors({});
    setWebsite("");
    startedAtRef.current = Date.now();
    setSubmitted(false);
  };

  const errorItems = Object.entries(errors).filter(([, value]) => Boolean(value)).map(([id, value]) => {
    if (id === "_cokform_email") return { id, label: "이메일 주소", detail: "유효한 이메일 주소를 입력해 주세요." };
    if (id === "_security") return { id, label: "보안 확인", detail: String(value) };
    const question = form.questions.find((item) => item.id === id);
    const fallbackIndex = form.questions.findIndex((item) => item.id === id) + 1;
    return {
      id,
      label: question?.title?.trim() || `질문 ${fallbackIndex > 0 ? fallbackIndex : ""}`.trim(),
      detail: value === "decline" ? "동의하지 않음을 선택하면 제출할 수 없어요." : "필수 항목입니다.",
    };
  });
  const requiredErrorCount = errorItems.filter((item) => item.id !== "_security").length;
  const securityError = errorItems.find((item) => item.id === "_security");

  if (submitted) {
    return (
      <div className={`rounded-xl bg-white p-8 text-center sm:p-10 ${ELEV1}`}>
        <div
          className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: `${color}1F`, color }}
        >
          <Check size={22} />
        </div>
        <div className="text-[15px] font-medium text-[#17251F]">{previewMode ? "작성 흐름을 확인했어요" : "응답이 저장되었습니다"}</div>
        {previewMode && <p className="mt-2 text-sm text-[#59645E]">미리보기에서는 응답을 저장하지 않았어요.</p>}
        <button onClick={restart} className="mt-4 text-sm font-medium hover:underline" style={{ color }}>
          {previewMode ? "처음부터 다시 확인" : "다른 응답 제출하기"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border-t-8 bg-white p-5 sm:p-6 ${ELEV1}`} style={{ borderTopColor: color }}>
        <h1 className="break-words text-xl font-normal text-[#17251F] sm:text-2xl">{form.title}</h1>
        {form.description && (form.descriptionFormat === "markdown" ? (
          <MarkdownContent
            content={form.description}
            className="mt-2 text-sm text-[#59645E]"
            style={descriptionTypography}
            image={descriptionImageSrc ? { src: descriptionImageSrc, alt: form.descriptionImage?.alt } : null}
            imagePosition={descriptionStyle.imageAlign || "center"}
            imageWidth={descriptionStyle.imageWidth || "full"}
          />
        ) : (
          <div
            className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#59645E]"
            style={descriptionTypography}
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(form.description) }}
          />
        ))}
        {descriptionImageSrc && form.descriptionFormat !== "markdown" && (
          <img
            src={descriptionImageSrc}
            alt={form.descriptionImage.alt || "설명 이미지"}
            className={`mt-4 max-h-72 w-full rounded-lg object-cover ${descriptionImageWidth} ${descriptionImageAlign}`}
          />
        )}
      </div>
      {form.settings?.privacyNotice && (
        <details className="rounded-xl border border-[#B7DCC8] bg-[#F7FCF8] text-sm text-[#355C45]" role="note">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-semibold text-[#0B4D3D] [&::-webkit-details-marker]:hidden">
            <span>개인정보 수집 안내</span>
            <span className="text-xs font-medium text-[#17866D]">제출 전 확인</span>
          </summary>
          <div className="border-t border-[#CDE9D8] px-4 pb-4 pt-3 leading-6">
            <p>
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
            <a href="/privacy" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-[#0B4D3D] underline underline-offset-2">콕폼 개인정보처리방침 보기</a>
          </div>
        </details>
      )}
      {form.settings?.collectEmail && (
        <section id="cokform-question-_cokform_email" className="rounded-xl border border-[#DDE1D9] bg-white p-5 sm:p-6" aria-labelledby="email-record-title">
          <div className="mb-4 flex items-start gap-2.5">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EAF6EF] text-[#0B4D3D]"><Mail size={15} /></span>
            <div>
              <div id="email-record-title" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#17251F]">이메일 주소 <span className="rounded-full bg-[#F1FAF4] px-2 py-0.5 text-[11px] font-bold text-[#0B4D3D]">필수</span></div>
              <p className="mt-1 text-xs leading-5 text-[#59645E]">작성자만 암호화된 응답에서 확인합니다.</p>
            </div>
          </div>
          <input id="cokform-email" type="email" required autoComplete="email" value={answers._cokform_email || ""} onChange={(e) => handleChange("_cokform_email", e.target.value)} placeholder="you@example.com" className={`w-full rounded-lg border bg-[#FFFDF8] px-3 py-3 text-base outline-none focus:border-[#17866D] focus:ring-4 focus:ring-[#D8F5E8] ${errors._cokform_email ? "border-[#B3261E]" : "border-[#C9CEC6]"}`} />
          {errors._cokform_email && <div className="mt-1 text-xs text-[#B3261E]">유효한 이메일 주소를 입력해주세요.</div>}
          {form.settings?.responseReceipt && <label className="mt-3 flex items-center gap-2 text-xs text-[#59645E]"><input type="checkbox" checked={Boolean(answers._cokform_receipt)} onChange={(e) => handleChange("_cokform_receipt", e.target.checked)} /> 제출 후 내 응답 사본 받기</label>}
        </section>
      )}
      {errorItems.length > 0 && (
        <div ref={errorSummaryRef} role="alert" aria-live="assertive" className="rounded-xl border border-[#F2B8B5] bg-[#FFF6F5] px-4 py-3.5 text-sm text-[#8C1D18]">
          <strong>
            {requiredErrorCount > 0 ? `필수 항목 ${requiredErrorCount}개를 확인해 주세요.` : "제출 전 보안 확인이 필요해요."}
          </strong>
          <p className="mt-1 text-xs leading-5 text-[#9A3A32]">
            {requiredErrorCount > 0 ? "작성하지 않은 첫 항목으로 이동했어요. 아래 항목을 누르면 해당 질문으로 바로 갈 수 있어요." : securityError?.detail}
          </p>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="오류 항목 바로가기">
            {errorItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => moveToError(item.id)}
                className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-[#E7A29D] bg-white px-3 py-1.5 text-left text-xs font-semibold text-[#8C1D18] transition-colors hover:bg-[#FDEBE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B3261E]/30"
                title={item.detail}
              >
                <span className="max-w-44 truncate">{item.label}</span>
                <span aria-hidden="true">바로가기 →</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {form.questions.filter((q) => isQuestionVisible(q, answers)).map((q) => (
        <QuestionField key={q.id} q={q} value={answers[q.id]} error={errors[q.id]} onChange={handleChange} />
      ))}
      {previewMode ? (
        <div role="note" className="rounded-xl border border-[#B7DCC8] bg-[#F1FAF4] px-4 py-3 text-sm leading-6 text-[#355C45]">
          <strong className="text-[#0B4D3D]">작성자 미리보기</strong> · 이 화면에서 작성한 내용은 저장·전송되지 않습니다.
        </div>
      ) : (
        <div className="absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="cokform-website">웹사이트</label>
          <input id="cokform-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
        </div>
      )}
      <div className="sticky bottom-0 z-10 -mx-3 bg-gradient-to-t from-[#F5F3EC] via-[#F5F3EC]/95 to-transparent px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-5 sm:static sm:mx-0 sm:bg-none sm:p-0">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={`min-h-[48px] w-full rounded-full px-6 py-3 text-base font-semibold text-white transition-shadow active:shadow-none disabled:cursor-wait disabled:opacity-60 sm:min-h-0 sm:w-auto sm:py-2.5 sm:text-sm ${ELEV1_HOVER}`}
          style={{ backgroundColor: color }}
        >
          {submitting ? (previewMode ? "확인 중…" : "저장하는 중…") : (previewMode ? "작성 흐름 확인" : "제출")}
        </button>
      </div>
    </div>
  );
}
