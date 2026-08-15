import { useState } from "react";
import { Check } from "lucide-react";
import QuestionField from "./QuestionField";
import { sanitizeRichText } from "../lib/sanitizeRichText";
import { ELEV1, ELEV1_HOVER, MD } from "../theme";

export default function PreviewForm({ form, onSubmit, accent }) {
  const color = accent || MD.primary;
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (qid, value) => {
    setAnswers((a) => ({ ...a, [qid]: value }));
    setErrors((e) => ({ ...e, [qid]: false }));
  };

  const handleSubmit = () => {
    const nextErrors = {};
    let hasError = false;

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

    setErrors(nextErrors);
    if (hasError) return;
    onSubmit(answers);
    setSubmitted(true);
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
      </div>
      {form.questions.map((q) => (
        <QuestionField key={q.id} q={q} value={answers[q.id]} error={errors[q.id]} onChange={handleChange} />
      ))}
      <button
        onClick={handleSubmit}
        className={`w-full rounded-full px-6 py-3 text-base font-medium text-white transition-shadow active:shadow-none sm:w-auto sm:py-2.5 sm:text-sm ${ELEV1_HOVER}`}
        style={{ backgroundColor: color }}
      >
        제출
      </button>
    </div>
  );
}
