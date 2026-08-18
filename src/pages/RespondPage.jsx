import { useEffect, useState } from "react";
import PreviewForm from "../components/PreviewForm";
import { getFormDoc, submitResponse, recordFormParticipation, recordFormView } from "../lib/formsStore";
import { ELEV1, MD } from "../theme";
import { getResponseWindowMessage, getResponseWindowState } from "../lib/responseWindow";

export default function RespondPage({ formId }) {
  const [doc, setDoc] = useState(undefined); // undefined = loading, null = not found
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  const handleSubmit = async (answers, turnstileToken) => {
    setSubmitError("");
    const result = await submitResponse(formId, answers, form.publicKey, form.settings, turnstileToken);
    if (!result.ok) {
      const windowMessage = result.reason && result.reason !== "duplicate" ? getResponseWindowMessage(result.reason, form.settings) : "";
      const securityMessage = {
        encryption_unavailable: "이 폼의 암호화 키가 준비되지 않았어요. 폼 작성자에게 문의해 주세요.",
        security_verification_required: "보안 확인을 완료한 뒤 다시 제출해 주세요.",
        security_verification_failed: "보안 확인에 실패했어요. 확인을 새로고침한 뒤 다시 시도해 주세요.",
        security_verification_unavailable: "보안 확인 서비스가 준비되지 않았어요. 잠시 후 다시 시도해 주세요.",
        rate_limited: "짧은 시간에 제출 요청이 많아요. 잠시 후 다시 시도해 주세요.",
        form_unavailable: "이 폼은 현재 응답을 받지 않아요.",
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
