import { ArrowLeft } from "lucide-react";

export function PublicPageShell({ eyebrow, title, description, icon: Icon, onBack, children, aside, backHref = "/", backLabel = "콕폼 홈으로" }) {
  return (
    <main className="min-h-screen bg-[#F5F3EC] px-4 py-7 text-[#17251F] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <a href={backHref} onClick={(event) => { if (onBack) { event.preventDefault(); onBack(); } }} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[#59645E] transition hover:text-[#0B4D3D] hover:underline"><ArrowLeft size={16} /> {backLabel}</a>
        <header className="border-b border-[#DDE1D9] pb-7 sm:pb-9">
          {Icon && <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6EF] text-[#17866D]"><Icon size={21} /></span>}
          {eyebrow && <p className="text-xs font-medium tracking-[0.06em] text-[#17866D]">{eyebrow}</p>}
          <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-[-0.05em] sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#59645E] sm:text-base">{description}</p>
        </header>
        <div className={`mt-6 grid gap-7 ${aside ? "lg:grid-cols-[minmax(0,1fr)_256px]" : ""}`}>
          <div className="min-w-0 space-y-5">{children}</div>
          {aside && <aside className="lg:sticky lg:top-6 lg:h-fit">{aside}</aside>}
        </div>
      </div>
    </main>
  );
}

export function DocumentCard({ children, tone = "default", className = "" }) {
  const toneClass = tone === "notice" ? "border-[#E4C77A] bg-[#FFF8DE] text-[#65521A]" : tone === "success" ? "border-[#B7DCC8] bg-[#F1FAF4] text-[#355C45]" : "border-[#DDE1D9] bg-[#FFFDF8] text-[#17251F]";
  return <section className={`border-l-2 px-5 py-5 sm:px-6 sm:py-6 ${toneClass} ${className}`}>{children}</section>;
}

export function AnchorNav({ items }) {
  return <nav aria-label="이 페이지 목차" className="border-y border-[#DDE1D9] py-3"><p className="px-2 pb-2 pt-1 text-xs font-medium tracking-[0.06em] text-[#17866D]">이 페이지에서 보기</p><div className="flex gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:overflow-visible">{items.map((item) => <a key={item.href} href={item.href} className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-[#59645E] transition hover:bg-[#EAF6EF] hover:text-[#0B4D3D]">{item.label}</a>)}</div></nav>;
}
