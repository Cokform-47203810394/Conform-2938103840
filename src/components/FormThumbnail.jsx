import { MD, TYPE_COLORS } from "../theme";

function plainText(value = "") {
  return String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function previewText(question) {
  const title = plainText(question.title);
  if (question.type === "date") return title || "희망 날짜";
  if (question.type === "time") return title || "희망 시간";
  if (["radio", "checkbox", "dropdown"].includes(question.type)) {
    return question.options?.[0] ? `${title || "선택"} · ${question.options[0]}` : title || "선택 항목";
  }
  return title || "질문을 입력하세요";
}

function TypeMark({ type, color }) {
  if (type === "checkbox") return <span className="h-2.5 w-2.5 rounded-[3px] border-2" style={{ borderColor: color }} />;
  if (type === "radio") return <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: color }} />;
  if (type === "date") return <span className="grid h-3.5 w-3.5 place-items-center rounded-[3px] border text-[7px] font-bold" style={{ borderColor: color, color }}>D</span>;
  if (type === "time") return <span className="grid h-3.5 w-3.5 place-items-center rounded-full border text-[7px] font-bold" style={{ borderColor: color, color }}>T</span>;
  return <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />;
}

export default function FormThumbnail({ questions = [], accent }) {
  const barAccent = accent || TYPE_COLORS[questions[0]?.type] || MD.primary;
  const visibleQuestions = questions
    .filter((question) => !["privacy_notice", "privacy_consent"].includes(question.type))
    .slice(0, 3);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white px-3 py-2.5">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="h-1.5 w-7 rounded-full" style={{ backgroundColor: barAccent }} />
        <span className="h-1.5 w-3 rounded-full bg-[#DDE1D9]" />
      </div>
      <div className="space-y-1.5">
        {(visibleQuestions.length ? visibleQuestions : [{ type: "short", title: "새 질문" }]).map((question, index) => (
          <div key={question.id || index} className="flex min-w-0 items-center gap-1.5 rounded-md border border-[#EEF0EA] bg-[#FFFDF8] px-1.5 py-1">
            <TypeMark type={question.type} color={TYPE_COLORS[question.type] || barAccent} />
            <span className="min-w-0 truncate text-[8px] font-medium leading-3 text-[#59645E]">{previewText(question)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
