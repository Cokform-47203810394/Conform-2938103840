import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  CircleDot,
  Clock3,
  FileText,
  ListPlus,
  Plus,
  ShieldCheck,
} from "lucide-react";

const QUICK_TYPES = [
  { type: "short", label: "단답형", icon: AlignLeft },
  { type: "paragraph", label: "장문형", icon: FileText },
  { type: "radio", label: "객관식", icon: CircleDot },
  { type: "checkbox", label: "체크박스", icon: CheckSquare },
  { type: "dropdown", label: "드롭다운", icon: ChevronDown },
  { type: "date", label: "날짜", icon: CalendarDays },
  { type: "time", label: "시간", icon: Clock3 },
  { type: "privacy_consent", label: "개인정보 동의", icon: ShieldCheck },
];

function QuickAddButton({ item, onAdd, compact = false }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => onAdd(item.type)}
      title={`${item.label} 질문 추가`}
      aria-label={`${item.label} 질문 추가`}
      className={compact
        ? "group flex shrink-0 items-center gap-1.5 rounded-xl border border-[#DDE1D9] bg-white px-3 py-2 text-xs font-semibold text-[#59645E] shadow-sm transition-colors duration-150 hover:border-[#17866D] hover:bg-[#F0FAF6] hover:text-[#0B4D3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17866D]/40"
        : "group flex h-12 w-12 items-center justify-center rounded-2xl border border-[#DDE1D9] bg-white text-[#59645E] shadow-[0_2px_8px_rgba(23,37,31,0.10)] transition-colors duration-150 hover:border-[#17866D] hover:bg-[#F0FAF6] hover:text-[#0B4D3D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17866D]/40"
      }
    >
      <Icon size={compact ? 15 : 19} strokeWidth={1.8} />
      {compact && <span>{item.label}</span>}
    </button>
  );
}

export default function QuickAddToolbar({ onAdd }) {
  return (
    <>
      <aside className="pointer-events-none fixed right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-1.5 rounded-[22px] border border-[#DDE1D9] bg-[#FFFDF8]/95 p-1.5 shadow-[0_8px_24px_rgba(23,37,31,0.12)] backdrop-blur lg:flex">
        <div className="mb-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-[#D8ED59] text-[#17251F]" title="질문 빠른 추가">
          <Plus size={17} strokeWidth={2.4} />
        </div>
        {QUICK_TYPES.map((item) => (
          <div key={item.type} className="pointer-events-auto">
            <QuickAddButton item={item} onAdd={onAdd} />
          </div>
        ))}
      </aside>

      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
        <div className="sticky left-0 flex shrink-0 items-center gap-1 rounded-xl bg-[#D8ED59] px-2.5 py-2 text-xs font-bold text-[#17251F]">
          <ListPlus size={15} /> 빠른 추가
        </div>
        {QUICK_TYPES.map((item) => (
          <QuickAddButton key={item.type} item={item} onAdd={onAdd} compact />
        ))}
      </div>
    </>
  );
}
