export function IconButton({ onClick, title, children, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#59645E] transition-colors active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent hover:bg-[#17251F]/[0.08] ${
        danger ? "hover:text-[#B3261E]" : "hover:text-[#17251F]"
      }`}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex select-none items-center gap-2 text-sm text-[#59645E]">
      {label && <span>{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-[52px] rounded-full border-2 transition-colors ${
          checked ? "border-[#17866D] bg-[#17866D]" : "border-[#78837C] bg-transparent"
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
