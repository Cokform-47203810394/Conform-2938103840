import { useEffect, useState } from "react";
import PreviewForm from "../components/PreviewForm";
import { getFormDoc, submitResponse } from "../lib/formsStore";
import { ELEV1, MD } from "../theme";

export default function RespondPage({ formId }) {
  const [doc, setDoc] = useState(undefined); // undefined = loading, null = not found
  const [alreadyResponded, setAlreadyResponded] = useState(false);

  useEffect(() => {
    getFormDoc(formId).then((d) => setDoc(d || null));
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
  const closed = form.settings?.acceptingResponses === false;
  const blocked = form.settings?.limitOneResponse && alreadyResponded;

  const handleSubmit = async (answers) => {
    const result = await submitResponse(formId, answers, form.publicKey);
    if (!result.ok) {
      window.alert("응답 저장에 실패했어요. 네트워크를 확인한 뒤 다시 시도해주세요.");
      return;
    }
    if (form.settings?.limitOneResponse) {
      localStorage.setItem(`form-builder:responded:${formId}`, "1");
      setAlreadyResponded(true);
    }
  };

  if (closed || blocked) {
    return (
      <div className="min-h-screen px-4 py-10" style={{ backgroundColor: form.backgroundColor || "#F5F3EC" }}>
        <div className={`mx-auto max-w-xl rounded-xl border-t-8 bg-white p-8 text-center ${ELEV1}`} style={{ borderTopColor: accent }}>
          <h1 className="text-xl font-normal text-[#17251F]">{form.title}</h1>
          <p className="mt-3 text-sm text-[#59645E]">
            {closed ? "현재 응답을 받고 있지 않은 설문지예요." : "이미 응답을 제출하셨어요. 응답은 1인 1회로 제한되어 있어요."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-3 py-6 sm:px-4" style={{ backgroundColor: form.backgroundColor || "#F5F3EC" }}>
      <div className="mx-auto max-w-2xl">
        <PreviewForm form={form} onSubmit={handleSubmit} accent={accent} />
      </div>
    </div>
  );
}
