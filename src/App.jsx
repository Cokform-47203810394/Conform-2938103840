import { useState } from "react";
import HomePage from "./pages/HomePage";
import FormEditorPage from "./pages/FormEditorPage";
import RespondPage from "./pages/RespondPage";
import SettingsPage from "./pages/SettingsPage";
import { ArrowLeft } from "lucide-react";
import { ELEV1 } from "./theme";

function getRespondFormId() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("respond");
}

export default function App() {
  // anyone opening a shared link (?respond=<id>) goes straight to the respondent view,
  // with none of the builder chrome — this is what makes 공유 actually work
  const respondFormId = getRespondFormId();
  if (respondFormId) {
    return <RespondPage formId={respondFormId} />;
  }

  return <Builder />;
}

function Builder() {
  // view: 'home' | 'editor' | 'settings'
  const [view, setView] = useState("home");
  const [currentFormId, setCurrentFormId] = useState(null);

  if (view === "editor" && currentFormId) {
    return (
      <FormEditorPage
        formId={currentFormId}
        onBack={() => setView("home")}
        onOpenAppSettings={() => setView("settings")}
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
      onOpenSettings={() => setView("settings")}
    />
  );
}
