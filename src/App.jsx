import { lazy, Suspense, useEffect, useState } from "react";
import HomePage from "./pages/HomePage";
import RespondPage from "./pages/RespondPage";
const FormEditorPage = lazy(() => import("./pages/FormEditorPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const SitemapPage = lazy(() => import("./pages/SitemapPage"));
const DocsPage = lazy(() => import("./pages/DocsPage"));
const DocsDetailPage = lazy(() => import("./pages/DocsDetailPage"));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage"));
const InternationalTransferPage = lazy(() => import("./pages/InternationalTransferPage"));
const ServiceRestrictionsPage = lazy(() => import("./pages/ServiceRestrictionsPage"));
const BusinessInfoPage = lazy(() => import("./pages/BusinessInfoPage"));
import AuthControl from "./components/AuthControl";
import { subscribeAuth } from "./lib/auth";
import { ArrowLeft } from "lucide-react";
import { ELEV1 } from "./theme";

function PageLoading() {
  return <div className="flex min-h-screen items-center justify-center bg-[#F5F3EC] text-sm text-[#78837C]">불러오는 중…</div>;
}

function getQueryMode() {
  if (typeof window === "undefined") return { respond: null, privacy: false, terms: false, sitemap: false, docs: false, docsSlug: null, resources: false, internationalTransfer: false, serviceRestrictions: false, businessInfo: false };
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  return {
    respond: params.get("respond"),
    privacy: pathname === "/privacy" || params.get("privacy") === "1",
    terms: pathname === "/terms" || params.get("terms") === "1",
    sitemap: pathname === "/sitemap",
    docs: pathname === "/docs",
    docsSlug: pathname.startsWith("/docs/") ? pathname.slice("/docs/".length) : null,
    resources: pathname === "/resources",
    internationalTransfer: pathname === "/international-transfer",
    serviceRestrictions: pathname === "/service-restrictions",
    businessInfo: pathname === "/business-info",
  };
}

export default function App() {
  // anyone opening a shared link (?respond=<id>) goes straight to the respondent view,
  // with none of the builder chrome — this is what makes 공유 actually work
  const { respond: respondFormId, privacy, terms, sitemap, docs, docsSlug, resources, internationalTransfer, serviceRestrictions, businessInfo } = getQueryMode();
  if (respondFormId) return <RespondPage formId={respondFormId} />;
  if (privacy) return <Suspense fallback={<PageLoading />}><PrivacyPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (terms) return <Suspense fallback={<PageLoading />}><TermsPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (sitemap) return <Suspense fallback={<PageLoading />}><SitemapPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (docsSlug) return <Suspense fallback={<PageLoading />}><DocsDetailPage slug={docsSlug} onBack={() => { window.location.href = "/docs"; }} /></Suspense>;
  if (docs) return <Suspense fallback={<PageLoading />}><DocsPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (resources) return <Suspense fallback={<PageLoading />}><ResourcesPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (internationalTransfer) return <Suspense fallback={<PageLoading />}><InternationalTransferPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (serviceRestrictions) return <Suspense fallback={<PageLoading />}><ServiceRestrictionsPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (businessInfo) return <Suspense fallback={<PageLoading />}><BusinessInfoPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  return <Builder />;
}

function Builder() {
  // view: 'home' | 'editor' | 'settings'
  const workspaceReturnForm = typeof window !== "undefined" ? sessionStorage.getItem("cokform:workspace:return-form") : null;
  const [view, setView] = useState(() => workspaceReturnForm ? "editor" : "home");
  const [currentFormId, setCurrentFormId] = useState(() => workspaceReturnForm || null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuth((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authReady && user && currentFormId) sessionStorage.removeItem("cokform:workspace:return-form");
  }, [authReady, currentFormId, user]);

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
      <Suspense fallback={<PageLoading />}>
        <FormEditorPage
          formId={currentFormId}
          user={user}
          onBack={() => { setCurrentFormId(null); setView("home"); }}
        />
      </Suspense>
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
          <Suspense fallback={<div className="py-10 text-center text-sm text-[#78837C]">설정을 불러오는 중…</div>}><SettingsPage /></Suspense>
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
