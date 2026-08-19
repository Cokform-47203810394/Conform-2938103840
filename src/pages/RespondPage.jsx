import { Component, useEffect, useState } from "react";
import PreviewForm from "../components/PreviewForm";
import { getFormDoc, submitResponse, recordFormParticipation, recordFormView } from "../lib/formsStore";
import { ELEV1, MD } from "../theme";
import { getResponseWindowMessage, getResponseWindowState } from "../lib/responseWindow";
import { verifyResponsePassword } from "../lib/responseAccess";

class RespondPageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    // Expose diagnostics only in the current browser session for incident triage.
    // The fallback UI intentionally stays generic and never reveals form data.
    window.__cokformRespondRenderError = {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    };
    console.error("공개 응답 화면 렌더링 오류", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#F5F3EC] px-4 text-center">
          <div className="max-w-sm rounded-2xl border border-[#DDE1D9] bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-[#17251F]">응답 양식을 열지 못했어요</h1>
            <p className="mt-2 text-sm leading-6 text-[#59645E]">새로고침한 뒤 다시 시도해 주세요. 계속되면 폼 작성자에게 공유 링크를 다시 받아주세요.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-[#17866D] px-4 py-2 text-sm font-semibold text-white">새로고침</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function RespondPageContent({ formId }) {
  const [doc, setDoc] = useState(undefined); // undefined = loading, null = not found
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [responsePassword, setResponsePassword] = useState("");
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    getFormDoc(formId).then((d) => {
      setDoc(d || null);
      if (d) recordFormView(formId);
    });
    setAlreadyResponded(Boolean(localStorage.getItem(`form-builder:responded:${formId}`)));
  }, [formId]);

  if (doc === undefined) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[#78837C]">불러오는 중…</div>;
  }
  if (doc === null) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-[#78837C]">
        존재하지 않거나 삭제된 설문지예요.
      </div>
    );
  }

  const { form } = doc;
  const accent = form.accentColor || MD.primary;
  const responseWindowState = getResponseWindowState(form.settings);
  const closed = responseWindowState !== "open";
  const blocked = form.settings?.limitOneResponse && alreadyResponded;
  const passwordProtected = Boolean(form.settings?.responsePassword?.hash);

  const unlockPasswordProtectedForm = async () => {
    const valid = await verifyResponsePassword(form.settings?.responsePassword, responsePassword);
    if (!valid) {
      setPasswordError("비밀번호가 맞지 않아요. 다시 확인해 주세요.");
      return;
    }
    setPasswordError("");
    setPasswordUnlocked(true);
  };

  const handleSubmit = async (answers, turnstileToken) => {
    setSubmitError("");
    const result = await submitResponse(formId, answers, form.publicKey, form.settings, turnstileToken, responsePassword);
    if (!result.ok) {
      const windowMessage = result.reason && result.reason !== "duplicate" ? getResponseWindowMessage(result.reason, form.settings) : "";
      const securityMessage = {
        encryption_unavailable: "이 폼의 암호화 키가 준비되지 않았어요. 폼 작성자에게 문의해 주세요.",
        security_verification_required: "보안 확인을 완료한 뒤 다시 제출해 주세요.",
        security_verification_failed: "보안 확인에 실패했어요. 확인을 새로고침한 뒤 다시 시도해 주세요.",
        security_verification_unavailable: "보안 확인 서비스가 준비되지 않았어요. 잠시 후 다시 시도해 주세요.",
        rate_limited: "짧은 시간에 제출 요청이 많아요. 잠시 후 다시 시도해 주세요.",
        form_unavailable: "이 폼은 현재 응답을 받지 않아요.",
        response_limit_reached: "이 양식은 정원에 도달해 더 이상 응답을 받을 수 없어요.",
        form_password_invalid: "입력한 비밀번호가 맞지 않아요. 다시 확인해 주세요.",
      }[result.reason];
      setSubmitError(result.reason === "duplicate" ? "이미 이 폼에 응답을 제출했어요." : securityMessage || windowMessage || "응답 저장에 실패했어요. 네트워크를 확인한 뒤 다시 시도해주세요.");
      return false;
    }
    if (form.settings?.limitOneResponse) {
      localStorage.setItem(`form-builder:responded:${formId}`, "1");
      setAlreadyResponded(true);
    }
    // Participation history is convenience metadata only: form ID, public title,
    // question count, and timestamp. It never contains answers or an encryption key.
    await recordFormParticipation(formId, form);
    return true;
  };

  if (passwordProtected && !passwordUnlocked && !closed && !blocked) {
    return (
      <div className="min-h-[100dvh] px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]" style={{ backgroundColor: form.backgroundColor || "#F5F3EC" }}>
        <div className={`mx-auto max-w-md rounded-xl border-t-8 bg-white p-6 sm:p-8 ${ELEV1}`} style={{ borderTopColor: accent }}>
          <h1 className="text-xl font-semibold text-[#17251F]">{form.title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#59645E]">이 양식은 비밀번호를 아는 사람만 작성할 수 있어요.</p>
          <label className="mt-5 block text-sm font-medium text-[#17251F]">양식 비밀번호<input type="password" value={responsePassword} onChange={(event) => { setResponsePassword(event.target.value); setPasswordError(""); }} onKeyDown={(event) => { if (event.key === "Enter") unlockPasswordProtectedForm(); }} autoComplete="current-password" className="mt-2 w-full rounded-lg border border-[#C9CEC6] bg-[#FFFDF8] px-3 py-3 text-base outline-none focus:border-[#17866D]" /></label>
          {passwordError && <p role="alert" className="mt-2 text-xs text-[#B3261E]">{passwordError}</p>}
          <button type="button" onClick={unlockPasswordProtectedForm} className="mt-5 w-full rounded-lg px-4 py-3 text-sm font-semibold text-white" style={{ backgroundColor: accent }}>양식 열기</button>
        </div>
      </div>
    );
  }

  if (closed || blocked) {
    return (
      <div className="min-h-[100dvh] px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-[calc(2.5rem+env(safe-area-inset-top))]" style={{ backgroundColor: form.backgroundColor || "#F5F3EC" }}>
        <div className={`mx-auto max-w-xl rounded-xl border-t-8 bg-white p-6 text-center sm:p-8 ${ELEV1}`} style={{ borderTopColor: accent }}>
          <h1 className="text-xl font-normal text-[#17251F]">{form.title}</h1>
          <p className="mt-3 text-sm text-[#59645E]">
            {closed ? getResponseWindowMessage(responseWindowState, form.settings) : "이미 응답을 제출하셨어요. 응답은 1인 1회로 제한되어 있어요."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-4 sm:py-6" style={{ backgroundColor: form.backgroundColor || "#F5F3EC" }}>
      <div className="mx-auto max-w-2xl">
        {submitError && <div role="alert" className="mb-3 rounded-xl border border-[#F2B8B5] bg-[#FFF6F5] px-4 py-3 text-sm text-[#8C1D18]">{submitError}</div>}
        <PreviewForm form={form} onSubmit={handleSubmit} accent={accent} />
      </div>
    </div>
  );
}

export default function RespondPage({ formId }) {
  return <RespondPageErrorBoundary><RespondPageContent formId={formId} /></RespondPageErrorBoundary>;
}
