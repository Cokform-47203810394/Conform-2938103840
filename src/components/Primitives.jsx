export function IconButton({ onClick, title, children, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#59645E] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#17866D]/45 disabled:opacity-30 disabled:hover:bg-transparent hover:bg-[#17251F]/[0.08] ${
        danger ? "hover:text-[#B3261E]" : "hover:text-[#17251F]"
      }`}
    >
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <div className="inline-flex select-none items-center gap-2 text-sm text-[#59645E]">
      {label && <span>{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || "설정 전환"}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#17866D]/40 ${
          checked ? "bg-[#17866D]" : "bg-[#C9CEC6]"
        }`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(23,37,31,0.28)] transition-transform duration-150 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
