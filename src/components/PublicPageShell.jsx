import { ArrowLeft } from "lucide-react";

export function PublicPageShell({ eyebrow, title, description, icon: Icon, onBack, children, aside }) {
  return (
    <main className="min-h-screen bg-[#F5F3EC] px-4 py-8 text-[#17251F] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <a href="/" onClick={(event) => { event.preventDefault(); onBack?.(); }} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#59645E] transition hover:text-[#0B4D3D] hover:underline"><ArrowLeft size={16} /> 콕폼 홈으로</a>
        <header className="rounded-[28px] bg-[#17251F] p-6 text-white shadow-[0_16px_40px_rgba(23,37,31,0.16)] sm:p-9">
          {Icon && <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D8ED59] text-[#17251F]"><Icon size={24} /></span>}
          <p className="font-mono text-xs font-bold tracking-[0.18em] text-[#D8ED59]">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-[-0.05em] sm:text-4xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#D6E1D8] sm:text-base">{description}</p>
        </header>
        <div className={`mt-7 grid gap-7 ${aside ? "lg:grid-cols-[minmax(0,1fr)_280px]" : ""}`}>
          <div className="min-w-0 space-y-5">{children}</div>
          {aside && <aside className="lg:sticky lg:top-6 lg:h-fit">{aside}</aside>}
        </div>
      </div>
    </main>
  );
}

export function DocumentCard({ children, tone = "default", className = "" }) {
  const toneClass = tone === "notice" ? "border-[#E4C77A] bg-[#FFF8DE] text-[#65521A]" : tone === "success" ? "border-[#B7DCC8] bg-[#F1FAF4] text-[#355C45]" : "border-[#DDE1D9] bg-[#FFFDF8] text-[#17251F]";
  return <section className={`rounded-2xl border p-5 shadow-[0_6px_20px_rgba(23,37,31,0.05)] sm:p-6 ${toneClass} ${className}`}>{children}</section>;
}

export function AnchorNav({ items }) {
  return <nav aria-label="이 페이지 목차" className="rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-3 shadow-[0_6px_20px_rgba(23,37,31,0.05)]"><p className="px-2 pb-2 pt-1 font-mono text-[10px] font-bold tracking-[0.14em] text-[#17866D]">ON THIS PAGE</p><div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible">{items.map((item) => <a key={item.href} href={item.href} className="shrink-0 rounded-xl px-3 py-2 text-sm font-medium text-[#59645E] transition hover:bg-[#EAF6EF] hover:text-[#0B4D3D]">{item.label}</a>)}</div></nav>;
}
