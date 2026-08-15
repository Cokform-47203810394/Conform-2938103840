import { MD, TYPE_COLORS } from "../theme";

export default function FormThumbnail({ questions = [], accent }) {
  const barAccent = accent || TYPE_COLORS[questions[0]?.type] || MD.primary;
  return (
    <div className="flex h-full w-full flex-col gap-2 overflow-hidden bg-white p-3">
      <div className="h-1.5 w-8 shrink-0 rounded-full" style={{ backgroundColor: barAccent }} />
      <div className="h-2 w-3/4 shrink-0 rounded bg-[#17251F]/70" />
      <div className="mt-1 space-y-2.5">
        {(questions.length ? questions : [{}, {}, {}]).slice(0, 3).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-1.5 w-2/3 rounded bg-[#C9CEC6]" />
            <div className="h-1.5 w-1/3 rounded bg-[#E7E5DC]" />
          </div>
        ))}
      </div>
    </div>
  );
}
