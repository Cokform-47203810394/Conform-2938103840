import { MD } from "../theme";

export default function Bar({ label, count, max, color }) {
  const pct = max === 0 ? 0 : Math.round((count / max) * 100);
  return (
    <div className="mb-2">
      <div className="mb-1 flex items-center justify-between text-xs text-[#59645E]">
        <span>{label}</span>
        <span className="font-mono">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#E7E5DC]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color || MD.primary }}
        />
      </div>
    </div>
  );
}
