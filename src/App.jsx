import { useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import FormEditorPage from "./pages/FormEditorPage";
import RespondPage from "./pages/RespondPage";
import SettingsPage from "./pages/SettingsPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import SitemapPage from "./pages/SitemapPage";
import AuthControl from "./components/AuthControl";
import { subscribeAuth } from "./lib/auth";
import { ArrowLeft } from "lucide-react";
import { ELEV1 } from "./theme";

function getQueryMode() {
  if (typeof window === "undefined") return { respond: null, privacy: false, terms: false, sitemap: false };
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  return {
    respond: params.get("respond"),
    privacy: pathname === "/privacy" || params.get("privacy") === "1",
    terms: pathname === "/terms" || params.get("terms") === "1",
    sitemap: pathname === "/sitemap",
  };
}

export default function App() {
  // anyone opening a shared link (?respond=<id>) goes straight to the respondent view,
  // with none of the builder chrome — this is what makes 공유 actually work
  const { respond: respondFormId, privacy, terms, sitemap } = getQueryMode();
  if (respondFormId) return <RespondPage formId={respondFormId} />;
  if (privacy) return <PrivacyPage onBack={() => { window.location.href = "/"; }} />;
  if (terms) return <TermsPage onBack={() => { window.location.href = "/"; }} />;
  if (sitemap) return <SitemapPage onBack={() => { window.location.href = "/"; }} />;
  return <Builder />;
}

function Builder() {
  // view: 'home' | 'editor' | 'settings'
  const [view, setView] = useState("home");
  const [currentFormId, setCurrentFormId] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuth((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  if (view === "editor" && currentFormId) {
    if (!authReady || !user) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F3EC] px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#FFFDF8] p-6 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-[#17251F]">작성자 로그인이 필요해요</h1>
            <p className="mt-2 text-sm leading-6 text-[#59645E]">폼과 응답은 작성자 계정에만 연결됩니다. Google 로그인 후 다시 열어주세요.</p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button onClick={() => setView("home")} className="rounded-full border border-[#C9CEC6] px-4 py-2 text-sm font-semibold text-[#59645E]">홈으로</button>
              <AuthControl />
            </div>
          </div>
        </div>
      );
    }
    return (
      <FormEditorPage
        formId={currentFormId}
        user={user}
        onBack={() => setView("home")}
      />
    );
  }

  if (view === "settings") {
    return (
      <div className="min-h-screen bg-[#F5F3EC]">
        <div className={`sticky top-0 z-10 bg-[#FFFDF8] ${ELEV1}`}>
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-3 sm:px-4">
            <button
              onClick={() => setView("home")}
              title="홈으로"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#59645E] hover:bg-[#17251F]/[0.08]"
            >
              <ArrowLeft size={18} />
            </button>
            <span className="text-lg font-normal text-[#17251F]">설정</span>
            <div className="ml-auto"><AuthControl user={user} compact showLogout={false} /></div>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-3 py-4 sm:px-4 sm:py-6">
          <SettingsPage />
        </div>
      </div>
    );
  }

  return (
    <HomePage
      onOpenForm={(id) => {
        setCurrentFormId(id);
        setView("editor");
      }}
      user={user}
      authReady={authReady}
      onOpenSettings={() => setView("settings")}
    />
  );
}
