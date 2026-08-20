import { useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  X,
  ShieldCheck,
  Info,
  GripVertical,
  MoreVertical,
} from "lucide-react";
import { IconButton, Toggle } from "./Primitives";
import RichTextInput from "./RichTextInput";
import { QUESTION_TYPES, PRIVACY_TYPES, defaultQuestion } from "../questionTypes";
import { MD, NAVER_GREEN, TYPE_COLORS, ELEV1, FIELD } from "../theme";

export default function QuestionEditor({
  q,
  questions = [],
  index,
  onChange,
  onDelete,
  onDuplicate,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isSelected = false,
  onSelect,
}) {
  const [dragHandleActive, setDragHandleActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const update = (patch) => onChange({ ...q, ...patch });

  const updateOption = (i, value) => {
    const options = [...q.options];
    options[i] = value;
    update({ options });
  };
  const addOption = () => update({ options: [...q.options, `옵션 ${q.options.length + 1}`] });
  const removeOption = (i) => update({ options: q.options.filter((_, idx) => idx !== i) });

  const accent = TYPE_COLORS[q.type] || MD.primary;
  const conditionSources = questions.slice(0, index).filter((question) => ["radio", "dropdown", "checkbox"].includes(question.type));
  const selectedConditionSource = conditionSources.find((question) => question.id === q.visibilityCondition?.questionId);

  return (
    <div
      draggable={dragHandleActive}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={() => {
        setDragHandleActive(false);
        onDragEnd?.();
      }}
      onMouseDown={onSelect}
      onFocusCapture={onSelect}
      className={`rounded-[18px] bg-white p-4 transition-[box-shadow,border-color,transform] duration-150 sm:p-5 ${ELEV1} ${isDragging ? "opacity-40" : ""} ${isSelected ? "ring-2 ring-[#17866D]/20" : "border border-transparent hover:border-[#DDE1D9] hover:shadow-[0_6px_18px_rgba(23,37,31,0.08)]"}`}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div
        onMouseDown={() => setDragHandleActive(true)}
        onMouseUp={() => setDragHandleActive(false)}
        className="mb-1 hidden cursor-grab justify-center text-[#C9CEC6] hover:text-[#78837C] active:cursor-grabbing sm:flex"
        title="드래그해서 순서 변경"
      >
        <GripVertical size={16} />
      </div>
      <div className="mb-3 flex flex-wrap items-start gap-2 sm:gap-3">
        <span
          className="mt-1 shrink-0 rounded-full px-2 py-0.5 font-mono text-xs font-semibold tracking-wider"
          style={{ backgroundColor: `${accent}1F`, color: accent }}
        >
          Q{String(index + 1).padStart(2, "0")}
        </span>
        {isSelected ? (
          <RichTextInput
            value={q.title}
            onChange={(html) => update({ title: html })}
            placeholder="질문"
            className={`${FIELD} min-w-[100px] flex-1 font-medium`}
          />
        ) : (
          <button type="button" onClick={onSelect} className="min-w-[100px] flex-1 truncate text-left text-sm font-medium text-[#17251F]">
            {String(q.title || "").replace(/<[^>]+>/g, "").trim() || "제목 없는 질문"}
          </button>
        )}
        <div className="flex w-full items-center gap-1.5 sm:w-auto">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
          {isSelected ? (
            <select
              value={q.type}
              onChange={(e) => {
                const nextType = e.target.value;
                const fresh = defaultQuestion(nextType);
                update({ type: nextType, ...fresh, id: q.id, title: q.title, required: q.required });
              }}
              className="w-full shrink-0 rounded-md border border-[#C9CEC6] bg-white px-2 py-2 text-base text-[#17251F] outline-none focus:border-[#17866D] sm:w-auto sm:py-1.5 sm:text-sm"
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
          ) : (
            <button type="button" onClick={onSelect} className="rounded-md bg-[#F5F3EC] px-2 py-1.5 text-xs font-medium text-[#59645E]">
              {questionTypeLabel(q.type)}
            </button>
          )}
        </div>
      </div>

      {!isSelected && (
        <button type="button" onClick={onSelect} className="ml-9 mt-1 flex w-[calc(100%-2.25rem)] items-center justify-between gap-3 rounded-lg bg-[#F8F9F4] px-3 py-2 text-left text-xs text-[#59645E] transition hover:bg-[#F0FAF6]">
          <span className="truncate">{questionSummary(q)}</span>
          <span className="shrink-0 font-semibold text-[#17866D]">편집</span>
        </button>
      )}

      {/* type-specific body */}
      <div className={isSelected ? "pl-4 sm:pl-9" : "hidden"}>
        {(q.type === "radio" || q.type === "checkbox" || q.type === "dropdown") && (
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[#78837C]">
                  {q.type === "checkbox" ? "▢" : q.type === "dropdown" ? `${i + 1}.` : "○"}
                </span>
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="min-w-0 flex-1 border-b border-[#C9CEC6] bg-transparent py-1.5 text-base text-[#17251F] outline-none focus:border-[#17866D] sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={q.options.length <= 1}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#78837C] hover:bg-[#17251F]/[0.08] hover:text-[#B3261E] disabled:opacity-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="mt-1 flex items-center gap-1 text-sm font-medium text-[#17866D] hover:underline"
            >
              <Plus size={14} /> 옵션 추가
            </button>
          </div>
        )}

        {q.type === "scale" && (
          <div className="flex flex-wrap items-center gap-2 text-base text-[#59645E] sm:gap-3 sm:text-sm">
            <div className="flex items-center gap-2">
              <select
                value={q.scaleMin}
                onChange={(e) => update({ scaleMin: Number(e.target.value) })}
                className="rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-base sm:py-1 sm:text-sm"
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
                className="rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-base sm:py-1 sm:text-sm"
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
              className="min-w-0 flex-1 rounded-md border border-[#C9CEC6] px-2 py-1.5 text-base sm:w-40 sm:flex-none sm:py-1 sm:text-sm"
            />
            <input
              value={q.scaleMaxLabel}
              onChange={(e) => update({ scaleMaxLabel: e.target.value })}
              placeholder={`${q.scaleMax}번 라벨 (선택)`}
              className="min-w-0 flex-1 rounded-md border border-[#C9CEC6] px-2 py-1.5 text-base sm:w-40 sm:flex-none sm:py-1 sm:text-sm"
            />
          </div>
        )}

        {q.type === "section" && (
          <div className="rounded-lg border border-[#B7DCC8] bg-[#F1FAF4] p-3">
            <div className="text-xs font-semibold text-[#0B4D3D]">섹션 안내</div>
            <textarea value={q.description || ""} onChange={(event) => update({ description: event.target.value })} rows={2} placeholder="이 섹션에서 작성할 내용을 안내하세요." className="mt-2 w-full rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-sm text-[#17251F] outline-none focus:border-[#17866D]" />
          </div>
        )}
        {q.type === "short" && (
          <div className="border-b border-dashed border-[#C9CEC6] pb-1 text-sm text-[#78837C]">단답형 텍스트</div>
        )}
        {q.type === "paragraph" && (
          <div className="border-b border-dashed border-[#C9CEC6] pb-1 text-sm text-[#78837C]">장문형 텍스트</div>
        )}
        {q.type === "date" && <div className="text-sm text-[#78837C]">날짜 선택</div>}
        {q.type === "time" && <div className="text-sm text-[#78837C]">시간 선택</div>}

        {conditionSources.length > 0 && q.type !== "privacy_notice" && q.type !== "privacy_consent" && (
          <div className="mt-3 rounded-lg border border-[#DDE1D9] bg-[#F8F9F4] p-3">
            <div className="text-xs font-semibold text-[#59645E]">조건부 표시</div>
            <p className="mt-1 text-[11px] leading-5 text-[#78837C]">앞선 선택에 따라 이 질문을 보여줄 수 있어요.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <select value={q.visibilityCondition?.questionId || ""} onChange={(event) => {
                const source = conditionSources.find((question) => question.id === event.target.value);
                update({ visibilityCondition: source ? { questionId: source.id, value: source.options?.[0] || "" } : null });
              }} className="rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-sm text-[#17251F] outline-none focus:border-[#17866D]">
                <option value="">항상 표시</option>
                {conditionSources.map((source) => <option key={source.id} value={source.id}>{String(source.title || "제목 없는 질문").replace(/<[^>]+>/g, "")}</option>)}
              </select>
              {selectedConditionSource && <select value={q.visibilityCondition?.value || ""} onChange={(event) => update({ visibilityCondition: { ...q.visibilityCondition, value: event.target.value } })} className="rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-sm text-[#17251F] outline-none focus:border-[#17866D]">{(selectedConditionSource.options || []).map((option) => <option key={option} value={option}>{option}일 때 표시</option>)}</select>}
            </div>
          </div>
        )}

        {q.type === "privacy_consent" && (
          <div
            className="space-y-3 rounded-lg border p-3"
            style={{ borderColor: `${NAVER_GREEN}4D`, backgroundColor: `${NAVER_GREEN}0D` }}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: NAVER_GREEN }}>
              <ShieldCheck size={14} /> 개인정보 수집·이용 동의
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <label className="block text-xs text-[#59645E]">
                수집 목적
                <input
                  value={q.purpose}
                  onChange={(e) => update({ purpose: e.target.value })}
                  className="mt-1 w-full rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#17866D]"
                />
              </label>
              <label className="block text-xs text-[#59645E]">
                수집 항목
                <input
                  value={q.items}
                  onChange={(e) => update({ items: e.target.value })}
                  className="mt-1 w-full rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#17866D]"
                />
              </label>
              <label className="block text-xs text-[#59645E]">
                보유 기간
                <input
                  value={q.retention}
                  onChange={(e) => update({ retention: e.target.value })}
                  className="mt-1 w-full rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#17866D]"
                />
              </label>
            </div>
            <label className="block text-xs text-[#59645E]">
              동의 거부권 및 거부 시 안내
              <textarea
                value={q.refusalRights || ""}
                onChange={(e) => update({ refusalRights: e.target.value })}
                rows={2}
                placeholder="예: 동의를 거부할 수 있으나, 동의하지 않으면 설문 제출이 제한됩니다."
                className="mt-1 w-full rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#17866D]"
              />
            </label>
            <div className="space-y-2">
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[#78837C]">○</span>
                  <input
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 border-b border-[#C9CEC6] bg-transparent py-1 text-sm text-[#17251F] outline-none focus:border-[#17866D]"
                  />
                  {i === 1 && <span className="shrink-0 text-[11px] text-[#78837C]">미동의 옵션</span>}
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
              className="w-full rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-sm sm:w-auto"
            >
              <option value="collection">개인정보 수집 및 이용 안내</option>
              <option value="entrustment">개인정보 처리 위탁 안내</option>
            </select>
            <textarea
              value={q.content}
              onChange={(e) => update({ content: e.target.value })}
              rows={3}
              className="w-full rounded-md border border-[#C9CEC6] bg-white px-2 py-1.5 text-sm text-[#17251F] outline-none focus:border-[#17866D]"
            />
          </div>
        )}
      </div>

      <div className={`mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E7E5DC] pt-3 pl-4 sm:pl-9 ${isSelected ? "" : "hidden"}`}>
        <div className="flex items-center gap-1">
          <IconButton title="복제" onClick={onDuplicate}>
            <Copy size={16} />
          </IconButton>
          <IconButton title="삭제" onClick={onDelete} danger>
            <Trash2 size={16} />
          </IconButton>
        </div>
        <div className="flex items-center gap-1">
          {q.type !== "privacy_notice" && q.type !== "section" && (
            <Toggle checked={q.required} onChange={(v) => update({ required: v })} label="필수 입력란입니다" />
          )}
          <div className="relative">
            <IconButton title="더보기" onClick={() => setMenuOpen((v) => !v)}>
              <MoreVertical size={16} />
            </IconButton>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-lg bg-white py-1 text-sm shadow-[0_2px_6px_2px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.3)]">
                  <button
                    onClick={() => {
                      onMove(-1);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#17251F] hover:bg-[#F5F3EC]"
                  >
                    <ChevronUp size={14} /> 위로 이동
                  </button>
                  <button
                    onClick={() => {
                      onMove(1);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#17251F] hover:bg-[#F5F3EC]"
                  >
                    <ChevronDown size={14} /> 아래로 이동
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function questionSummary(q) {
  if (q.type === "section") return q.description || "섹션 안내를 작성하세요.";
  if (q.type === "privacy_notice") return "개인정보 처리 안내 · 동의 없이 읽는 안내문";
  if (q.type === "privacy_consent") return `개인정보 동의 · ${q.purpose || "수집 목적 설정 필요"}`;
  if (["radio", "checkbox", "dropdown"].includes(q.type)) return `${q.options?.length || 0}개 선택지`;
  if (q.type === "scale") return `${q.scaleMin} ~ ${q.scaleMax} 점 척도`;
  if (q.type === "paragraph") return "긴 답변 입력";
  if (q.type === "date") return "날짜 입력";
  if (q.type === "time") return "시간 입력";
  return "짧은 답변 입력";
}

function questionTypeLabel(type) {
  const allTypes = [...QUESTION_TYPES, ...PRIVACY_TYPES];
  return allTypes.find((item) => item.value === type)?.label || "질문";
}
