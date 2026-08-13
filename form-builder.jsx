import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Eye,
  Pencil,
  BarChart3,
  X,
  Check,
  ShieldCheck,
  Info,
} from "lucide-react";

// ---------- Material Design 3 tokens (baseline purple theme) ----------
// ref: m3.material.io/foundations/design-tokens
const MD = {
  primary: "#6750A4",
  onPrimary: "#FFFFFF",
  primaryContainer: "#EADDFF",
  onPrimaryContainer: "#21005D",
  surface: "#FFFBFE",
  surfaceContainer: "#F3EDF7",
  surfaceVariant: "#E7E0EC",
  onSurface: "#1C1B1F",
  onSurfaceVariant: "#49454F",
  outline: "#79747E",
  outlineVariant: "#CAC4D0",
  error: "#B3261E",
  errorContainer: "#F9DEDC",
};

// Naver Form-style accent, used only for privacy consent/notice question types
const NAVER_GREEN = "#03C75A";

// per-type accent colors — makes the question list scannable at a glance
const TYPE_COLORS = {
  short: "#4F86F7",
  paragraph: "#7C6FF0",
  radio: "#6750A4",
  checkbox: "#00A896",
  dropdown: "#F2994A",
  scale: "#EB5757",
  date: "#219653",
  time: "#C08A00",
  privacy_consent: NAVER_GREEN,
  privacy_notice: NAVER_GREEN,
};

// rotating palette for response bar charts (option-level color, not just one flat purple)
const CHART_PALETTE = [
  "#6750A4",
  "#4F86F7",
  "#00A896",
  "#F2994A",
  "#EB5757",
  "#219653",
  "#7C6FF0",
  "#C08A00",
];

// M3 elevation shadow approximations
const ELEV1 = "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_3px_1px_rgba(0,0,0,0.15)]";
const ELEV2 = "shadow-[0_1px_2px_rgba(0,0,0,0.3),0_2px_6px_2px_rgba(0,0,0,0.15)]";
const ELEV3 = "shadow-[0_1px_3px_rgba(0,0,0,0.3),0_4px_8px_3px_rgba(0,0,0,0.15)]";

const FIELD =
  "w-full rounded-t-md bg-[#F3EDF7] px-3 pt-2.5 pb-2 text-base text-[#1C1B1F] outline-none border-b-2 border-[#79747E] focus:border-[#6750A4] focus:bg-[#ECE6F0] transition-colors";

// ---------- constants ----------

const QUESTION_TYPES = [
  { value: "short", label: "단답형" },
  { value: "paragraph", label: "장문형" },
  { value: "radio", label: "객관식 질문" },
  { value: "checkbox", label: "체크박스" },
  { value: "dropdown", label: "드롭다운" },
  { value: "scale", label: "선형 배율" },
  { value: "date", label: "날짜" },
  { value: "time", label: "시간" },
];

const PRIVACY_TYPES = [
  { value: "privacy_consent", label: "개인정보 수집·이용 동의" },
  { value: "privacy_notice", label: "개인정보 수집·위탁 안내" },
];

const ALL_TYPES = [...QUESTION_TYPES, ...PRIVACY_TYPES];

const TYPE_LABEL = Object.fromEntries(ALL_TYPES.map((t) => [t.value, t.label]));

const STORAGE_KEY = "form-builder:state";

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function defaultQuestion(type = "short") {
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

function emptyForm() {
  return {
    title: "제목 없는 설문지",
    description: "",
    questions: [defaultQuestion("radio")],
  };
}

// ---------- small primitives ----------

function IconButton({ onClick, title, children, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#49454F] transition-colors active:scale-95 hover:bg-[#1C1B1F]/[0.08] ${
        danger ? "hover:text-[#B3261E]" : "hover:text-[#1C1B1F]"
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex select-none items-center gap-2 text-sm text-[#49454F]">
      {label && <span>{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-[52px] rounded-full border-2 transition-colors ${
          checked ? "border-[#6750A4] bg-[#6750A4]" : "border-[#79747E] bg-transparent"
        }`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-all ${
            checked ? "left-[26px] h-6 w-6" : "left-1 h-4 w-4"
          }`}
        />
      </button>
    </label>
  );
}

// ---------- question editor (edit tab) ----------

function QuestionEditor({ q, index, total, onChange, onDelete, onDuplicate, onMove }) {
  const update = (patch) => onChange({ ...q, ...patch });

  const updateOption = (i, value) => {
    const options = [...q.options];
    options[i] = value;
    update({ options });
  };
  const addOption = () => update({ options: [...q.options, `옵션 ${q.options.length + 1}`] });
  const removeOption = (i) => update({ options: q.options.filter((_, idx) => idx !== i) });

  return (
    <div
      className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}
      style={{ borderLeft: `4px solid ${TYPE_COLORS[q.type] || MD.primary}` }}
    >
      <div className="mb-3 flex flex-wrap items-start gap-2 sm:gap-3">
        <span
          className="mt-1 shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-semibold tracking-wider"
          style={{
            backgroundColor: `${TYPE_COLORS[q.type] || MD.primary}1F`,
            color: TYPE_COLORS[q.type] || MD.primary,
          }}
        >
          Q{String(index + 1).padStart(2, "0")}
        </span>
        <input
          value={q.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="질문"
          className={`${FIELD} min-w-[100px] flex-1 font-medium`}
        />
        <div className="flex w-full items-center gap-1.5 sm:w-auto">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: TYPE_COLORS[q.type] || MD.primary }}
          />
          <select
          value={q.type}
          onChange={(e) => {
            const nextType = e.target.value;
            const fresh = defaultQuestion(nextType);
            update({ type: nextType, ...fresh, id: q.id, title: q.title, required: q.required });
          }}
          className="w-full shrink-0 rounded-md border border-[#CAC4D0] bg-white px-2 py-2 text-base text-[#1C1B1F] outline-none focus:border-[#6750A4] sm:w-auto sm:py-1.5 sm:text-sm"
        >
          <optgroup label="일반 문항">
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </optgroup>
          <optgroup label="개인정보 보호">
            {PRIVACY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </optgroup>
        </select>
        </div>
      </div>

      {/* type-specific body */}
      <div className="pl-4 sm:pl-9">
        {(q.type === "radio" || q.type === "checkbox" || q.type === "dropdown") && (
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[#79747E]">
                  {q.type === "checkbox" ? "▢" : q.type === "dropdown" ? `${i + 1}.` : "○"}
                </span>
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="min-w-0 flex-1 border-b border-[#CAC4D0] bg-transparent py-1.5 text-base text-[#1C1B1F] outline-none focus:border-[#6750A4] sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={q.options.length <= 1}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#79747E] hover:bg-[#1C1B1F]/[0.08] hover:text-[#B3261E] disabled:opacity-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="mt-1 flex items-center gap-1 text-sm font-medium text-[#6750A4] hover:underline"
            >
              <Plus size={14} /> 옵션 추가
            </button>
          </div>
        )}

        {q.type === "scale" && (
          <div className="flex flex-wrap items-center gap-2 text-base text-[#49454F] sm:gap-3 sm:text-sm">
            <div className="flex items-center gap-2">
              <select
                value={q.scaleMin}
                onChange={(e) => update({ scaleMin: Number(e.target.value) })}
                className="rounded-md border border-[#CAC4D0] bg-white px-2 py-1.5 text-base sm:py-1 sm:text-sm"
              >
                {[0, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span>~</span>
              <select
                value={q.scaleMax}
                onChange={(e) => update({ scaleMax: Number(e.target.value) })}
                className="rounded-md border border-[#CAC4D0] bg-white px-2 py-1.5 text-base sm:py-1 sm:text-sm"
              >
                {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={q.scaleMinLabel}
              onChange={(e) => update({ scaleMinLabel: e.target.value })}
              placeholder={`${q.scaleMin}번 라벨 (선택)`}
              className="min-w-0 flex-1 rounded-md border border-[#CAC4D0] px-2 py-1.5 text-base sm:w-40 sm:flex-none sm:py-1 sm:text-sm"
            />
            <input
              value={q.scaleMaxLabel}
              onChange={(e) => update({ scaleMaxLabel: e.target.value })}
              placeholder={`${q.scaleMax}번 라벨 (선택)`}
              className="min-w-0 flex-1 rounded-md border border-[#CAC4D0] px-2 py-1.5 text-base sm:w-40 sm:flex-none sm:py-1 sm:text-sm"
            />
          </div>
        )}

        {q.type === "short" && (
          <div className="border-b border-dashed border-[#CAC4D0] pb-1 text-sm text-[#79747E]">
            단답형 텍스트
          </div>
        )}
        {q.type === "paragraph" && (
          <div className="border-b border-dashed border-[#CAC4D0] pb-1 text-sm text-[#79747E]">
            장문형 텍스트
          </div>
        )}
        {q.type === "date" && <div className="text-sm text-[#79747E]">날짜 선택</div>}
        {q.type === "time" && <div className="text-sm text-[#79747E]">시간 선택</div>}

        {q.type === "privacy_consent" && (
          <div
            className="space-y-3 rounded-lg border p-3"
            style={{ borderColor: `${NAVER_GREEN}4D`, backgroundColor: `${NAVER_GREEN}0D` }}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: NAVER_GREEN }}>
              <ShieldCheck size={14} /> 동의 문항 · 네이버폼 스타일
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="block text-xs text-[#49454F]">
                수집 목적
                <input
                  value={q.purpose}
                  onChange={(e) => update({ purpose: e.target.value })}
                  className="mt-1 w-full rounded-md border border-[#CAC4D0] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#6750A4]"
                />
              </label>
              <label className="block text-xs text-[#49454F]">
                수집 항목
                <input
                  value={q.items}
                  onChange={(e) => update({ items: e.target.value })}
                  className="mt-1 w-full rounded-md border border-[#CAC4D0] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#6750A4]"
                />
              </label>
              <label className="block text-xs text-[#49454F]">
                보유 기간
                <input
                  value={q.retention}
                  onChange={(e) => update({ retention: e.target.value })}
                  className="mt-1 w-full rounded-md border border-[#CAC4D0] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#6750A4]"
                />
              </label>
            </div>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[#79747E]">○</span>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 border-b border-[#CAC4D0] bg-transparent py-1 text-sm text-[#1C1B1F] outline-none focus:border-[#6750A4]"
                  />
                  {i === 1 && (
                    <span className="shrink-0 text-[11px] text-[#79747E]">미동의 옵션</span>
                  )}
                </div>
              ))}
            </div>
            <Toggle
              checked={q.blockOnDecline}
              onChange={(v) => update({ blockOnDecline: v })}
              label="미동의 선택 시 제출 차단"
            />
          </div>
        )}

        {q.type === "privacy_notice" && (
          <div
            className="space-y-3 rounded-lg border p-3"
            style={{ borderColor: `${NAVER_GREEN}4D`, backgroundColor: `${NAVER_GREEN}0D` }}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: NAVER_GREEN }}>
              <Info size={14} /> 안내 전용 · 동의 불필요
            </div>
            <select
              value={q.noticeType}
              onChange={(e) => update({ noticeType: e.target.value })}
              className="w-full rounded-md border border-[#CAC4D0] bg-white px-2 py-1.5 text-sm sm:w-auto"
            >
              <option value="collection">개인정보 수집 및 이용 안내</option>
              <option value="entrustment">개인정보 처리 위탁 안내</option>
            </select>
            <textarea
              value={q.content}
              onChange={(e) => update({ content: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-[#CAC4D0] bg-white px-2 py-1.5 text-sm text-[#1C1B1F] outline-none focus:border-[#6750A4]"
            />
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E7E0EC] pt-3 pl-4 sm:pl-9">
        <div className="flex items-center gap-1">
          <IconButton title="위로 이동" onClick={() => onMove(-1)}>
            <ChevronUp size={16} />
          </IconButton>
          <IconButton title="아래로 이동" onClick={() => onMove(1)}>
            <ChevronDown size={16} />
          </IconButton>
          <IconButton title="복제" onClick={onDuplicate}>
            <Copy size={15} />
          </IconButton>
          <IconButton title="삭제" onClick={onDelete} danger>
            <Trash2 size={15} />
          </IconButton>
        </div>
        {q.type !== "privacy_notice" && (
          <Toggle checked={q.required} onChange={(v) => update({ required: v })} label="필수" />
        )}
      </div>
    </div>
  );
}

// ---------- preview / respondent view ----------

function QuestionField({ q, value, error, onChange }) {
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
        <div className="text-[15px] font-medium text-[#1C1B1F]">{q.title}</div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-[#49454F]">{q.content}</p>
      </div>
    );
  }

  if (q.type === "privacy_consent") {
    return (
      <div className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1} ${error ? "ring-2 ring-[#B3261E]" : ""}`}>
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: NAVER_GREEN }}>
          <ShieldCheck size={14} /> 개인정보 수집·이용 동의
        </div>
        <div className="mb-3 text-[15px] font-medium text-[#1C1B1F]">
          {q.title}
          <span className="ml-1 text-[#B3261E]">*</span>
        </div>
        <div
          className="mb-4 space-y-1 rounded-lg border p-3 text-xs text-[#49454F]"
          style={{ borderColor: `${NAVER_GREEN}4D`, backgroundColor: `${NAVER_GREEN}0D` }}
        >
          <div>
            <span className="font-medium text-[#1C1B1F]">수집 목적</span> · {q.purpose}
          </div>
          <div>
            <span className="font-medium text-[#1C1B1F]">수집 항목</span> · {q.items}
          </div>
          <div>
            <span className="font-medium text-[#1C1B1F]">보유 기간</span> · {q.retention}
          </div>
        </div>
        <div>
          {q.options.map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-2.5 rounded-md py-1 px-1 text-base text-[#1C1B1F] hover:bg-[#1C1B1F]/[0.04] sm:text-sm"
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

  return (
    <div
      className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1} ${
        error ? "ring-2 ring-[#B3261E]" : ""
      }`}
      style={{ borderLeft: `4px solid ${TYPE_COLORS[q.type] || MD.primary}` }}
    >
      <div className="mb-3 text-[15px] font-medium text-[#1C1B1F]">
        {q.title || <span className="text-[#79747E]">제목 없는 질문</span>}
        {q.required && <span className="ml-1 text-[#B3261E]">*</span>}
      </div>

      {q.type === "short" && (
        <input
          value={value || ""}
          onChange={(e) => set(e.target.value)}
          className={`${FIELD} sm:text-sm`}
        />
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
            <label key={i} className="flex items-center gap-2.5 rounded-md py-1 px-1 text-base text-[#1C1B1F] hover:bg-[#1C1B1F]/[0.04] sm:text-sm">
              <input
                type="radio"
                name={q.id}
                checked={value === opt}
                onChange={() => set(opt)}
                className="h-4 w-4 shrink-0 accent-[#6750A4]"
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
              <label key={i} className="flex items-center gap-2.5 rounded-md py-1 px-1 text-base text-[#1C1B1F] hover:bg-[#1C1B1F]/[0.04] sm:text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    set(checked ? arr.filter((v) => v !== opt) : [...arr, opt])
                  }
                  className="h-4 w-4 shrink-0 accent-[#6750A4]"
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
          className="w-full rounded-md border border-[#CAC4D0] px-2 py-2.5 text-base focus:border-[#6750A4] sm:py-2 sm:text-sm"
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
          {q.scaleMinLabel && <span className="text-xs text-[#79747E]">{q.scaleMinLabel}</span>}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, i) => q.scaleMin + i).map(
              (n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set(n)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm transition-colors ${
                    value === n
                      ? "border-[#6750A4] bg-[#6750A4] text-white"
                      : "border-[#79747E] text-[#49454F] hover:bg-[#1C1B1F]/[0.06]"
                  }`}
                >
                  {n}
                </button>
              )
            )}
          </div>
          {q.scaleMaxLabel && <span className="text-xs text-[#79747E]">{q.scaleMaxLabel}</span>}
        </div>
      )}
      {q.type === "date" && (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => set(e.target.value)}
          className="w-full rounded-md border border-[#CAC4D0] px-2 py-2.5 text-base focus:border-[#6750A4] sm:w-auto sm:py-2 sm:text-sm"
        />
      )}
      {q.type === "time" && (
        <input
          type="time"
          value={value || ""}
          onChange={(e) => set(e.target.value)}
          className="w-full rounded-md border border-[#CAC4D0] px-2 py-2.5 text-base focus:border-[#6750A4] sm:w-auto sm:py-2 sm:text-sm"
        />
      )}
      {error && <div className="mt-2 text-xs text-[#B3261E]">이 질문은 필수입니다.</div>}
    </div>
  );
}

function PreviewForm({ form, onSubmit }) {
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
      const empty =
        v === undefined ||
        v === "" ||
        (Array.isArray(v) && v.length === 0);
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
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#EADDFF] text-[#21005D]">
          <Check size={22} />
        </div>
        <div className="text-[15px] font-medium text-[#1C1B1F]">응답이 저장되었습니다</div>
        <button
          onClick={restart}
          className="mt-4 text-sm font-medium text-[#6750A4] hover:underline"
        >
          다른 응답 제출하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border-t-8 border-t-[#6750A4] bg-white p-5 sm:p-6 ${ELEV1}`}>
        <h1 className="break-words text-xl font-normal text-[#1C1B1F] sm:text-2xl">{form.title}</h1>
        {form.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#49454F]">{form.description}</p>
        )}
      </div>
      {form.questions.map((q) => (
        <QuestionField
          key={q.id}
          q={q}
          value={answers[q.id]}
          error={errors[q.id]}
          onChange={handleChange}
        />
      ))}
      <button
        onClick={handleSubmit}
        className={`w-full rounded-full bg-[#6750A4] px-6 py-3 text-base font-medium text-white transition-shadow active:shadow-none sm:w-auto sm:py-2.5 sm:text-sm ${ELEV1} hover:${ELEV2}`}
      >
        제출
      </button>
    </div>
  );
}

// ---------- responses tab ----------

function Bar({ label, count, max, color }) {
  const pct = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-xs text-[#49454F]">
        <span>{label}</span>
        <span className="font-mono">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7E0EC]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color || MD.primary }}
        />
      </div>
    </div>
  );
}

function ResponsesView({ form, responses, onClear }) {
  if (responses.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#CAC4D0] bg-white p-12 text-center text-sm text-[#79747E]">
        아직 응답이 없습니다. 미리보기 탭에서 제출해보세요.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`flex items-center justify-between rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}>
        <div>
          <div className="font-mono text-2xl font-bold text-[#1C1B1F]">{responses.length}</div>
          <div className="text-xs text-[#79747E]">개 응답</div>
        </div>
        <IconButton title="응답 전체 삭제" onClick={onClear} danger>
          <Trash2 size={16} />
        </IconButton>
      </div>

      {form.questions.map((q) => {
        if (q.type === "privacy_notice") return null; // 응답값 없음, 통계 제외
        const values = responses.map((r) => r.answers[q.id]).filter((v) => v !== undefined && v !== "");
        return (
          <div
            key={q.id}
            className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}
            style={{ borderLeft: `4px solid ${TYPE_COLORS[q.type] || MD.primary}` }}
          >
            <div className="mb-3 text-sm font-medium text-[#1C1B1F]">
              {q.title || "제목 없는 질문"}
              <span className="ml-2 text-xs font-normal text-[#79747E]">{TYPE_LABEL[q.type]}</span>
            </div>

            {["radio", "dropdown", "privacy_consent"].includes(q.type) && (
              <div>
                {q.options.map((opt, i) => {
                  const c = values.filter((v) => v === opt).length;
                  return (
                    <Bar
                      key={opt}
                      label={opt}
                      count={c}
                      max={responses.length}
                      color={CHART_PALETTE[i % CHART_PALETTE.length]}
                    />
                  );
                })}
              </div>
            )}

            {q.type === "checkbox" && (
              <div>
                {q.options.map((opt, i) => {
                  const c = values.filter((v) => Array.isArray(v) && v.includes(opt)).length;
                  return (
                    <Bar
                      key={opt}
                      label={opt}
                      count={c}
                      max={responses.length}
                      color={CHART_PALETTE[i % CHART_PALETTE.length]}
                    />
                  );
                })}
              </div>
            )}

            {q.type === "scale" && (
              <div>
                {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, i) => q.scaleMin + i).map(
                  (n, i) => {
                    const c = values.filter((v) => v === n).length;
                    return (
                      <Bar
                        key={n}
                        label={String(n)}
                        count={c}
                        max={responses.length}
                        color={CHART_PALETTE[i % CHART_PALETTE.length]}
                      />
                    );
                  }
                )}
              </div>
            )}

            {["short", "paragraph", "date", "time"].includes(q.type) && (
              <ul className="space-y-1.5 text-sm text-[#49454F]">
                {values.map((v, i) => (
                  <li key={i} className="border-b border-[#F3EDF7] pb-1.5 last:border-0">
                    {v}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- app ----------

export default function App() {
  const [form, setForm] = useState(emptyForm());
  const [responses, setResponses] = useState([]);
  const [tab, setTab] = useState("edit");
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  // load Roboto (Material Design's default typeface) + ensure mobile viewport
  useEffect(() => {
    if (!document.getElementById("md3-roboto-font")) {
      const link = document.createElement("link");
      link.id = "md3-roboto-font";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap";
      document.head.appendChild(link);
    }
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    meta.content = "width=device-width, initial-scale=1, viewport-fit=cover";
  }, []);

  // load once
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (parsed.form) setForm(parsed.form);
          if (parsed.responses) setResponses(parsed.responses);
        }
      } catch (e) {
        // no saved state yet
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // debounced save
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(
          STORAGE_KEY,
          JSON.stringify({ form, responses }),
          false
        );
      } catch (e) {
        console.error("저장 실패", e);
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [form, responses, loaded]);

  const updateQuestion = (id, next) => {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q) => (q.id === id ? next : q)),
    }));
  };
  const deleteQuestion = (id) => {
    setForm((f) => ({ ...f, questions: f.questions.filter((q) => q.id !== id) }));
  };
  const duplicateQuestion = (id) => {
    setForm((f) => {
      const idx = f.questions.findIndex((q) => q.id === id);
      const copy = { ...f.questions[idx], id: uid() };
      const questions = [...f.questions];
      questions.splice(idx + 1, 0, copy);
      return { ...f, questions };
    });
  };
  const moveQuestion = (id, dir) => {
    setForm((f) => {
      const idx = f.questions.findIndex((q) => q.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= f.questions.length) return f;
      const questions = [...f.questions];
      [questions[idx], questions[newIdx]] = [questions[newIdx], questions[idx]];
      return { ...f, questions };
    });
  };
  const addQuestion = () => {
    setForm((f) => ({ ...f, questions: [...f.questions, defaultQuestion("short")] }));
  };

  const handleFormSubmit = useCallback((answers) => {
    setResponses((r) => [...r, { id: uid(), submittedAt: new Date().toISOString(), answers }]);
  }, []);

  const clearResponses = () => setResponses([]);

  const tabs = [
    { id: "edit", label: "질문", icon: Pencil },
    { id: "preview", label: "미리보기", icon: Eye },
    { id: "responses", label: "응답", icon: BarChart3, badge: responses.length },
  ];

  return (
    <div
      className="min-h-screen bg-[#F3EDF7]"
      style={{ fontFamily: "'Roboto', 'Noto Sans KR', sans-serif" }}
    >
      <style>{`
        .safe-bottom { padding-bottom: max(6rem, calc(env(safe-area-inset-bottom) + 5rem)); }
        input, select, textarea, button { -webkit-tap-highlight-color: transparent; }
      `}</style>

      {/* M3 top app bar */}
      <div className={`sticky top-0 z-10 bg-[#FFFBFE] ${ELEV1}`}>
        <div className="mx-auto max-w-3xl px-3 py-2.5 sm:px-4 sm:py-3">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-transparent text-base font-normal text-[#1C1B1F] outline-none sm:text-xl"
          />
        </div>
        <div className="mx-auto flex max-w-3xl gap-0.5 px-1 sm:gap-1 sm:px-4">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 border-b-[3px] px-2 py-2.5 text-sm font-medium transition-colors sm:flex-none sm:px-4 ${
                  active
                    ? "border-[#6750A4] text-[#6750A4]"
                    : "border-transparent text-[#49454F] hover:bg-[#1C1B1F]/[0.04]"
                }`}
              >
                <Icon size={15} />
                {t.label}
                {t.badge > 0 && (
                  <span className="rounded-full bg-[#E7E0EC] px-1.5 font-mono text-[11px] text-[#49454F]">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="safe-bottom relative mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
        {tab === "edit" && (
          <div className="space-y-3 sm:space-y-4">
            <div className={`rounded-xl border-t-8 border-t-[#6750A4] bg-white p-4 sm:p-5 ${ELEV1}`}>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="설문지 설명"
                rows={2}
                className="w-full resize-none bg-transparent text-base text-[#49454F] outline-none sm:text-sm"
              />
            </div>

            {form.questions.map((q, i) => (
              <QuestionEditor
                key={q.id}
                q={q}
                index={i}
                total={form.questions.length}
                onChange={(next) => updateQuestion(q.id, next)}
                onDelete={() => deleteQuestion(q.id)}
                onDuplicate={() => duplicateQuestion(q.id)}
                onMove={(dir) => moveQuestion(q.id, dir)}
              />
            ))}

            {/* M3 Extended FAB */}
            <button
              onClick={addQuestion}
              className={`fixed bottom-6 right-4 z-20 flex items-center gap-2 rounded-2xl bg-[#EADDFF] px-5 py-4 text-sm font-medium text-[#21005D] transition-shadow active:scale-95 sm:right-8 ${ELEV3}`}
            >
              <Plus size={20} /> 질문 추가
            </button>
          </div>
        )}

        {tab === "preview" && <PreviewForm form={form} onSubmit={handleFormSubmit} />}

        {tab === "responses" && (
          <ResponsesView form={form} responses={responses} onClear={clearResponses} />
        )}
      </div>
    </div>
  );
}
