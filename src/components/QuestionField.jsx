import { ShieldCheck, Info } from "lucide-react";
import { MD, NAVER_GREEN, TYPE_COLORS, ELEV1, FIELD } from "../theme";
import { sanitizeRichText } from "../lib/sanitizeRichText";
import MarkdownContent from "./MarkdownContent";

export default function QuestionField({ q, value, error, onChange }) {
  const set = (v) => onChange(q.id, v);

  if (q.type === "privacy_notice") {
    return (
      <div
        className="rounded-xl border p-4 sm:p-5"
        style={{ borderColor: `${NAVER_GREEN}66`, backgroundColor: `${NAVER_GREEN}0D` }}
      >
        <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: NAVER_GREEN }}>
          <Info size={14} />
          {q.noticeType === "entrustment" ? "개인정보 처리 위탁 안내" : "개인정보 수집 및 이용 안내"}
        </div>
        <div className="text-[15px] font-medium text-[#17251F]" dangerouslySetInnerHTML={{ __html: sanitizeRichText(q.title) }} />
        <p className="mt-2 whitespace-pre-wrap text-sm text-[#59645E]">{q.content}</p>
      </div>
    );
  }

  if (q.type === "section") {
    return (
      <section className="rounded-xl border border-[#B7DCC8] bg-[#F1FAF4] px-4 py-4 sm:px-5">
        <div className="text-[11px] font-semibold tracking-wide text-[#0B4D3D]">섹션</div>
        <h2 className="mt-1 text-lg font-semibold text-[#17251F]" dangerouslySetInnerHTML={{ __html: sanitizeRichText(q.title) }} />
        {q.description && (q.descriptionFormat === "markdown" ? <MarkdownContent content={q.description} className="mt-1.5 text-sm text-[#355C45]" /> : <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-[#355C45]">{q.description}</p>)}
      </section>
    );
  }

  if (q.type === "privacy_consent") {
    return (
      <div id={`cokform-question-${q.id}`} className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1} ${error ? "ring-2 ring-[#B3261E]" : ""}`}>
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: NAVER_GREEN }}>
          <ShieldCheck size={14} /> 개인정보 수집·이용 동의
        </div>
        <div className="mb-3 text-[15px] font-medium text-[#17251F]">
          <span dangerouslySetInnerHTML={{ __html: sanitizeRichText(q.title) }} />
          <span className="ml-1 text-[#B3261E]">*</span>
        </div>
        <div
          className="mb-4 space-y-1 rounded-lg border p-3 text-xs text-[#59645E]"
          style={{ borderColor: `${NAVER_GREEN}4D`, backgroundColor: `${NAVER_GREEN}0D` }}
        >
          <div>
            <span className="font-medium text-[#17251F]">수집 목적</span> · {q.purpose}
          </div>
          <div>
            <span className="font-medium text-[#17251F]">수집 항목</span> · {q.items}
          </div>
          <div>
            <span className="font-medium text-[#17251F]">보유 기간</span> · {q.retention}
          </div>
          <div>
            <span className="font-medium text-[#17251F]">동의 거부권</span> · {q.refusalRights || "동의를 거부할 수 있으며, 거부 시 설문 제출이 제한될 수 있습니다."}
          </div>
        </div>
        <div>
          {q.options.map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-2.5 rounded-md py-1 px-1 text-base text-[#17251F] hover:bg-[#17251F]/[0.04] sm:text-sm"
            >
              <input
                type="radio"
                name={q.id}
                checked={value === opt}
                onChange={() => set(opt)}
                className="h-4 w-4 shrink-0"
                style={{ accentColor: NAVER_GREEN }}
              />
              {opt}
            </label>
          ))}
        </div>
        {error && (
          <div className="mt-2 text-xs text-[#B3261E]">
            {error === "decline" ? "동의하지 않아 설문을 제출할 수 없습니다." : "이 질문은 필수입니다."}
          </div>
        )}
      </div>
    );
  }

  const accent = TYPE_COLORS[q.type] || MD.primary;

  return (
    <div
      id={`cokform-question-${q.id}`}
      className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1} ${error ? "ring-2 ring-[#B3261E]" : ""}`}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="mb-3 text-[15px] font-medium text-[#17251F]">
        {q.title ? (
          <span dangerouslySetInnerHTML={{ __html: sanitizeRichText(q.title) }} />
        ) : (
          <span className="text-[#78837C]">제목 없는 질문</span>
        )}
        {q.required && <span className="ml-1 text-[#B3261E]">*</span>}
      </div>

      {q.type === "short" && (
        <input value={value || ""} onChange={(e) => set(e.target.value)} className={`${FIELD} sm:text-sm`} />
      )}
      {q.type === "paragraph" && (
        <textarea
          value={value || ""}
          onChange={(e) => set(e.target.value)}
          rows={3}
          className={`${FIELD} sm:text-sm`}
        />
      )}
      {q.type === "radio" && (
        <div>
          {q.options.map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-2.5 rounded-md py-1 px-1 text-base text-[#17251F] hover:bg-[#17251F]/[0.04] sm:text-sm"
            >
              <input
                type="radio"
                name={q.id}
                checked={value === opt}
                onChange={() => set(opt)}
                className="h-4 w-4 shrink-0 accent-[#17866D]"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
      {q.type === "checkbox" && (
        <div>
          {q.options.map((opt, i) => {
            const arr = Array.isArray(value) ? value : [];
            const checked = arr.includes(opt);
            return (
              <label
                key={i}
                className="flex items-center gap-2.5 rounded-md py-1 px-1 text-base text-[#17251F] hover:bg-[#17251F]/[0.04] sm:text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => set(checked ? arr.filter((v) => v !== opt) : [...arr, opt])}
                  className="h-4 w-4 shrink-0 accent-[#17866D]"
                />
                {opt}
              </label>
            );
          })}
        </div>
      )}
      {q.type === "dropdown" && (
        <select
          value={value || ""}
          onChange={(e) => set(e.target.value)}
          className="w-full rounded-md border border-[#C9CEC6] px-2 py-2.5 text-base focus:border-[#17866D] sm:py-2 sm:text-sm"
        >
          <option value="">선택</option>
          {q.options.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
      {q.type === "scale" && (
        <div className="flex flex-wrap items-center gap-3">
          {q.scaleMinLabel && <span className="text-xs text-[#78837C]">{q.scaleMinLabel}</span>}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, i) => q.scaleMin + i).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set(n)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm transition-colors ${
                  value === n
                    ? "border-[#17866D] bg-[#17866D] text-white"
                    : "border-[#78837C] text-[#59645E] hover:bg-[#17251F]/[0.06]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          {q.scaleMaxLabel && <span className="text-xs text-[#78837C]">{q.scaleMaxLabel}</span>}
        </div>
      )}
      {q.type === "date" && (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => set(e.target.value)}
          className="w-full rounded-md border border-[#C9CEC6] px-2 py-2.5 text-base focus:border-[#17866D] sm:w-auto sm:py-2 sm:text-sm"
        />
      )}
      {q.type === "time" && (
        <input
          type="time"
          value={value || ""}
          onChange={(e) => set(e.target.value)}
          className="w-full rounded-md border border-[#C9CEC6] px-2 py-2.5 text-base focus:border-[#17866D] sm:w-auto sm:py-2 sm:text-sm"
        />
      )}
      {error && <div className="mt-2 text-xs text-[#B3261E]">이 질문은 필수입니다.</div>}
    </div>
  );
}
