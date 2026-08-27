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
const AfterHoursPage = lazy(() => import("./pages/AfterHoursPage"));
const CokformStatePage = lazy(() => import("./pages/CokformStatePage"));
import AuthControl from "./components/AuthControl";
import { subscribeAuth } from "./lib/auth";
import { ArrowLeft } from "lucide-react";
import { ELEV1 } from "./theme";
import { isPublicSlugPath } from "./lib/publicSlug";

function PageLoading() {
  return <div className="flex min-h-screen items-center justify-center bg-[#F5F3EC] text-sm text-[#78837C]">불러오는 중…</div>;
}

function UnknownRoutePage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#F5F3EC] px-4 text-center"><section className="max-w-sm rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-6"><p className="text-xs font-semibold tracking-[0.08em] text-[#17866D]">COKFORM</p><h1 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#17251F]">찾는 페이지가 없어요</h1><p className="mt-2 text-sm leading-6 text-[#59645E]">주소를 다시 확인하거나 콕폼 홈에서 필요한 페이지를 찾아주세요.</p><a href="/" className="mt-5 inline-flex rounded-full bg-[#17866D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0F705B]">홈으로</a></section></main>;
}

const EDITOR_RETURN_FORM_KEY = "cokform:editor:return-form";
const WORKSPACE_RETURN_FORM_KEY = "cokform:workspace:return-form";

function readOAuthProblem() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  const description = params.get("error_description") || "";
  if (!error) return null;
  const lowered = description.toLowerCase();
  if (lowered.includes("state") || lowered.includes("code verifier")) {
    return "로그인 연결이 중간에 끊겼어요. Google 로그인은 시작한 같은 브라우저 탭에서 끝까지 진행한 뒤 다시 시도해 주세요.";
  }
  if (error === "access_denied") {
    return "Google에서 권한을 허용하지 않았어요. 사용하는 Google 계정이 허용된 테스트 사용자인지 확인한 뒤 다시 시도해 주세요.";
  }
  return "로그인을 완료하지 못했어요. 잠시 후 같은 브라우저 탭에서 다시 시도해 주세요.";
}

function OAuthProblemNotice({ message, onDismiss }) {
  if (!message) return null;
  return <div role="alert" className="mx-auto mb-4 flex max-w-6xl flex-wrap items-center justify-between gap-3 rounded-xl border border-[#F0C4BE] bg-[#FFF6F5] px-4 py-3 text-sm text-[#8C1D18]"><span>{message}</span><div className="flex items-center gap-2"><button type="button" onClick={signInWithGoogle} className="rounded-full border border-[#D85B4A] bg-white px-3 py-1.5 text-xs font-semibold text-[#8C1D18] hover:bg-[#FBE4E0]">다시 로그인</button><button type="button" onClick={onDismiss} className="rounded-full px-2 py-1 text-xs font-semibold text-[#8C1D18] hover:bg-[#FBE4E0]">닫기</button></div></div>;
}

function readSessionFormId(key) {
  try {
    return sessionStorage.getItem(key) || null;
  } catch {
    return null;
  }
}

function writeSessionFormId(key, formId) {
  try {
    if (formId) sessionStorage.setItem(key, formId);
    else sessionStorage.removeItem(key);
  } catch {
    // Session restoration is a convenience only. It must never block editing.
  }
}

function getQueryMode() {
  if (typeof window === "undefined") return { respond: null, publicSlug: null, privacy: false, terms: false, sitemap: false, docs: false, docsSlug: null, resources: false, internationalTransfer: false, serviceRestrictions: false, businessInfo: false, afterHours: false, state: false, unknown: false };
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const reservedPaths = ["/privacy", "/terms", "/sitemap", "/docs", "/resources", "/international-transfer", "/service-restrictions", "/business-info", "/after-hours", "/status"];
  const publicSlug = pathname.startsWith("/") && !reservedPaths.includes(pathname) && !pathname.startsWith("/docs/")
    ? isPublicSlugPath(pathname)
    : null;
  return {
    respond: params.get("respond"),
    publicSlug,
    privacy: pathname === "/privacy" || params.get("privacy") === "1",
    terms: pathname === "/terms" || params.get("terms") === "1",
    sitemap: pathname === "/sitemap",
    docs: pathname === "/docs",
    docsSlug: pathname.startsWith("/docs/") ? pathname.slice("/docs/".length) : null,
    resources: pathname === "/resources",
    internationalTransfer: pathname === "/international-transfer",
    serviceRestrictions: pathname === "/service-restrictions",
    businessInfo: pathname === "/business-info",
    afterHours: pathname === "/after-hours",
    state: pathname === "/status",
    unknown: pathname !== "/" && !reservedPaths.includes(pathname) && !pathname.startsWith("/docs/") && !publicSlug,
  };
}

export default function App() {
  // anyone opening a shared link (?respond=<id>) goes straight to the respondent view,
  // with none of the builder chrome — this is what makes 공유 actually work
  const { respond: respondFormId, publicSlug, privacy, terms, sitemap, docs, docsSlug, resources, internationalTransfer, serviceRestrictions, businessInfo, afterHours, state, unknown } = getQueryMode();
  if (respondFormId) return <RespondPage formId={respondFormId} />;
  if (publicSlug) return <RespondPage formSlug={publicSlug} />;
  if (privacy) return <Suspense fallback={<PageLoading />}><PrivacyPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (terms) return <Suspense fallback={<PageLoading />}><TermsPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (sitemap) return <Suspense fallback={<PageLoading />}><SitemapPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (docsSlug) return <Suspense fallback={<PageLoading />}><DocsDetailPage slug={docsSlug} onBack={() => { window.location.href = "/docs"; }} /></Suspense>;
  if (docs) return <Suspense fallback={<PageLoading />}><DocsPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (resources) return <Suspense fallback={<PageLoading />}><ResourcesPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (internationalTransfer) return <Suspense fallback={<PageLoading />}><InternationalTransferPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (serviceRestrictions) return <Suspense fallback={<PageLoading />}><ServiceRestrictionsPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (businessInfo) return <Suspense fallback={<PageLoading />}><BusinessInfoPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (afterHours) return <Suspense fallback={<PageLoading />}><AfterHoursPage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (state) return <Suspense fallback={<PageLoading />}><CokformStatePage onBack={() => { window.location.href = "/"; }} /></Suspense>;
  if (unknown) return <UnknownRoutePage />;
  return <Builder />;
}

function Builder() {
  // view: 'home' | 'editor' | 'settings'
  const workspaceReturnForm = typeof window !== "undefined" ? readSessionFormId(WORKSPACE_RETURN_FORM_KEY) : null;
  const editorReturnForm = typeof window !== "undefined" ? readSessionFormId(EDITOR_RETURN_FORM_KEY) : null;
  const initialFormId = workspaceReturnForm || editorReturnForm;
  const [view, setView] = useState(() => initialFormId ? "editor" : "home");
  const [currentFormId, setCurrentFormId] = useState(() => initialFormId || null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [oauthProblem, setOauthProblem] = useState(() => readOAuthProblem());

  useEffect(() => {
    const unsubscribe = subscribeAuth((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  const dismissOAuthProblem = () => {
    setOauthProblem(null);
    if (typeof window === "undefined") return;
    window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.hash}`);
  };

  useEffect(() => {
    if (authReady && user && currentFormId) writeSessionFormId(WORKSPACE_RETURN_FORM_KEY, null);
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
          onBack={() => {
            writeSessionFormId(EDITOR_RETURN_FORM_KEY, null);
            setCurrentFormId(null);
            setView("home");
          }}
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
    <>
      <div className="bg-[#F5F3EC] px-3 pt-3 sm:px-6"><OAuthProblemNotice message={oauthProblem} onDismiss={dismissOAuthProblem} /></div>
      <HomePage
      onOpenForm={(id) => {
        writeSessionFormId(EDITOR_RETURN_FORM_KEY, id);
        setCurrentFormId(id);
        setView("editor");
      }}
      user={user}
      authReady={authReady}
      onOpenSettings={() => setView("settings")}
      />
    </>
  );
}
