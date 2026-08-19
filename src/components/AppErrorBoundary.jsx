import { Component } from "react";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Keep the user-facing recovery page generic. Detailed diagnostics stay local
    // to the browser console and never include form or response contents.
    console.error("콕폼 화면 렌더링 오류", error);
    try {
      sessionStorage.setItem("cokform:last-render-error", String(error?.message || "unknown-render-error").slice(0, 240));
    } catch {
      // Storage may be unavailable in a restricted browser context.
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#F5F3EC] px-4 text-center">
          <section className="max-w-sm rounded-2xl border border-[#DDE1D9] bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold text-[#17866D]">COKFORM</p>
            <h1 className="mt-2 text-lg font-semibold text-[#17251F]">화면을 열지 못했어요</h1>
            <p className="mt-2 text-sm leading-6 text-[#59645E]">새로고침한 뒤 다시 시도해 주세요. 문제가 계속되면 폼 링크 또는 작업 내용을 알려주세요.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-[#17866D] px-4 py-2 text-sm font-semibold text-white">새로고침</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
