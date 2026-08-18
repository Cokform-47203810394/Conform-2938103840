import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Download, FileJson, FileSpreadsheet, ImageDown, LoaderCircle, Mail, Presentation, Table2, Trash2, Upload } from "lucide-react";
import { IconButton } from "./Primitives";
import Bar from "./Bar";
import { MD, TYPE_COLORS, CHART_PALETTE, ELEV1 } from "../theme";
import { TYPE_LABEL } from "../questionTypes";
import { richTextToPlain } from "../lib/sanitizeRichText";
import { createCsvBlob, createExcelBlob, createSummaryPngBlob, downloadCsv, downloadExcelCompatible, downloadJson, downloadPresentation, downloadSummaryPng } from "../lib/exportResponses";
import { getGoogleDriveAccessToken, requestGoogleDriveAccess, uploadGoogleDriveFile } from "../lib/googleDriveExport";

function exportFileName(form, suffix) {
  const title = (form.title || "cokform").replace(/[\\/:*?"<>|]/g, "-").slice(0, 80) || "cokform";
  return `${title}-${suffix}`;
}

function formatAnswer(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "미응답";
  if (value === true) return "예";
  if (value === false) return "아니오";
  if (value === undefined || value === null || value === "") return "미응답";
  return String(value);
}

function formatSubmittedAt(value) {
  if (!value) return "제출 시각 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "제출 시각 없음";
  return date.toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ResponsesView({ form, formId, responses, onClear, onDeleteResponse, onAudit }) {
  const [view, setView] = useState("summary");
  const [selectedResponseId, setSelectedResponseId] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState("");
  const [exportNotice, setExportNotice] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  useEffect(() => {
    if (responses.length && !responses.some((response) => response.id === selectedResponseId)) {
      setSelectedResponseId(responses[0].id);
    }
  }, [responses, selectedResponseId]);

  const responseQuestions = useMemo(
    () => form.questions.filter((question) => question.type !== "privacy_notice"),
    [form.questions],
  );
  const selectedIndex = Math.max(0, responses.findIndex((response) => response.id === selectedResponseId));
  const selectedResponse = responses[selectedIndex] || null;
  const selectResponse = (responseId) => {
    setSelectedResponseId(responseId);
    setView("individual");
  };

  const recordExport = (format, destination = "device") => {
    Promise.resolve(onAudit?.("export", { format, destination, responseCount: responses.length })).catch(() => {});
  };

  const exportLocal = async (format, action) => {
    setExportNotice("");
    setExportOpen(false);
    try {
      await action();
      recordExport(format);
    } catch {
      setExportNotice(`${format.toUpperCase()} 파일을 만들지 못했어요. 브라우저의 다운로드 차단 여부를 확인해 주세요.`);
    }
  };

  const connectGoogleDrive = async () => {
    setExportNotice("");
    setExportOpen(false);
    await requestGoogleDriveAccess(formId);
  };

  const exportToDrive = async (target) => {
    setDriveUrl("");
    setExportNotice("");
    const accessToken = await getGoogleDriveAccessToken();
    if (!accessToken) {
      setExportNotice("Google Drive가 아직 연결되지 않았어요. 내보내기 메뉴에서 ‘Google Drive 연결’을 먼저 눌러 주세요.");
      return;
    }

    setExporting(target);
    setExportOpen(false);
    try {
      let blob;
      let name;
      let mimeType;
      let convertToMimeType;
      if (target === "sheets") {
        blob = createCsvBlob(form, responses);
        name = exportFileName(form, "응답.csv");
        mimeType = "text/csv";
        convertToMimeType = "application/vnd.google-apps.spreadsheet";
      } else if (target === "excel") {
        blob = createExcelBlob(form, responses);
        name = exportFileName(form, "응답.xls");
        mimeType = "application/vnd.ms-excel";
      } else {
        blob = await createSummaryPngBlob(form, responses);
        name = exportFileName(form, "응답요약.png");
        mimeType = "image/png";
      }
      if (!blob) throw new Error("empty_export");
      const uploaded = await uploadGoogleDriveFile(accessToken, { blob, name, mimeType, convertToMimeType });
      setExportNotice(target === "sheets" ? "Google Sheets에 새 응답 파일을 만들었습니다." : "내 Google Drive에 파일을 업로드했습니다.");
      setDriveUrl(uploaded.webViewLink || "");
      recordExport(target === "sheets" ? "google_sheets" : `drive_${target}`, "google_drive");
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setExportNotice("Google Drive 권한이 만료됐어요. 내보내기 메뉴의 ‘Google Drive 연결’을 눌러 다시 허용해 주세요.");
      } else {
        setExportNotice("내보내기 파일을 Google Drive로 보내지 못했어요. 네트워크와 Google 연결 상태를 확인해 주세요.");
      }
    } finally {
      setExporting("");
    }
  };

  if (responses.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#C9CEC6] bg-white p-12 text-center text-sm text-[#78837C]">
        아직 응답이 없습니다. 공유 링크를 통해 제출된 응답은 이곳에서 요약·질문별·개별 답변으로 확인할 수 있어요.
      </div>
    );
  }

  const recentResponses = [...responses].slice(-3).reverse();
  const recordedEmailCount = form.settings?.collectEmail
    ? responses.filter((response) => typeof response.answers?._cokform_email === "string" && response.answers._cokform_email.trim()).length
    : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}>
        <div>
          <div className="font-mono text-2xl font-bold text-[#17251F]">{responses.length}</div>
          <div className="text-xs text-[#78837C]">개 응답</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              aria-expanded={exportOpen}
              onClick={() => setExportOpen((open) => !open)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9CEC6] bg-white px-3 py-2 text-xs font-semibold text-[#59645E] transition-colors hover:bg-[#F5F3EC]"
            >
              <Download size={14} /> 내보내기 <ChevronDown size={14} className={exportOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {exportOpen && <button type="button" aria-label="내보내기 메뉴 닫기" onClick={() => setExportOpen(false)} className="fixed inset-0 z-30 cursor-default" />}
            {exportOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-3 shadow-[0_12px_30px_rgba(23,37,31,0.16)]">
                <p className="px-1 pb-2 text-[11px] leading-5 text-[#78837C]">CSV·Excel·JSON에는 응답 원문이 들어갑니다. 집계 요약 PNG·PPTX에는 개인정보·자유 입력 원문을 기본으로 넣지 않습니다.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => exportLocal("csv", () => downloadCsv(form, responses))} className="export-button"><Download size={14} /> CSV 원문</button>
                  <button type="button" onClick={() => exportLocal("excel", () => downloadExcelCompatible(form, responses))} className="export-button"><FileSpreadsheet size={14} /> Excel 원문</button>
                  <button type="button" onClick={() => exportLocal("json", () => downloadJson(form, responses))} className="export-button"><FileJson size={14} /> JSON 원문</button>
                  <button type="button" onClick={() => exportLocal("summary_png", () => downloadSummaryPng(form, responses))} className="export-button"><ImageDown size={14} /> 집계 요약 PNG</button>
                  <button type="button" onClick={() => exportLocal("summary_pptx", () => downloadPresentation(form, responses))} className="export-button col-span-2"><Presentation size={14} /> 집계 요약 PPTX</button>
                </div>
                <div className="my-3 border-t border-[#E7E5DC]" />
                <p className="px-1 pb-2 text-[11px] font-semibold text-[#59645E]">Google Workspace</p>
                <button type="button" onClick={connectGoogleDrive} className="export-button mb-2 w-full border-[#B7DCC8] bg-[#F1FAF4] text-[#0B4D3D]"><Upload size={14} /> Google Drive 연결</button>
                <div className="grid grid-cols-1 gap-2">
                  <button type="button" onClick={() => exportToDrive("sheets")} disabled={Boolean(exporting)} className="export-button"><Table2 size={14} /> {exporting === "sheets" && <LoaderCircle className="animate-spin" size={14} />} Google Sheets로 보내기</button>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => exportToDrive("excel")} disabled={Boolean(exporting)} className="export-button"><Upload size={14} /> {exporting === "excel" && <LoaderCircle className="animate-spin" size={14} />} Drive Excel</button>
                    <button type="button" onClick={() => exportToDrive("image")} disabled={Boolean(exporting)} className="export-button"><Upload size={14} /> {exporting === "image" && <LoaderCircle className="animate-spin" size={14} />} Drive PNG</button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <IconButton title="응답 전체 삭제" onClick={onClear} danger>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      {exportNotice && <div role="status" className="rounded-xl border border-[#B7DCC8] bg-[#EAF6EF] px-3 py-2.5 text-xs leading-5 text-[#355C45]">{exportNotice}{driveUrl && <> <a href={driveUrl} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">Drive에서 열기</a></>}</div>}

      <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-[#DDE1D9] bg-white p-1" role="tablist" aria-label="응답 보기 방식">
        <button type="button" role="tab" aria-selected={view === "summary"} onClick={() => setView("summary")} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${view === "summary" ? "bg-[#EAF6EF] text-[#0B4D3D]" : "text-[#78837C] hover:bg-[#F5F3EC]"}`}>요약</button>
        <button type="button" role="tab" aria-selected={view === "question"} onClick={() => setView("question")} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${view === "question" ? "bg-[#EAF6EF] text-[#0B4D3D]" : "text-[#78837C] hover:bg-[#F5F3EC]"}`}>질문별</button>
        <button type="button" role="tab" aria-selected={view === "individual"} onClick={() => setView("individual")} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${view === "individual" ? "bg-[#EAF6EF] text-[#0B4D3D]" : "text-[#78837C] hover:bg-[#F5F3EC]"}`}>개별 응답</button>
      </div>

      {view === "summary" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`rounded-xl bg-white p-4 ${ELEV1}`}><div className="text-xs font-medium text-[#78837C]">전체 응답</div><div className="mt-1 font-mono text-2xl font-bold text-[#17251F]">{responses.length}</div></div>
            <div className={`rounded-xl bg-white p-4 ${ELEV1}`}><div className="text-xs font-medium text-[#78837C]">기록된 이메일</div><div className="mt-1 font-mono text-2xl font-bold text-[#17251F]">{recordedEmailCount}</div></div>
            <button type="button" onClick={() => setView("individual")} className={`rounded-xl bg-[#EAF6EF] p-4 text-left transition-colors hover:bg-[#DDF1E5] ${ELEV1}`}><div className="text-xs font-medium text-[#355C45]">응답 원문 확인</div><div className="mt-1 text-sm font-semibold text-[#0B4D3D]">개별 응답 보기 →</div></button>
          </div>
          <section className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}>
            <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="text-sm font-semibold text-[#17251F]">최근 응답</h3><p className="mt-1 text-xs text-[#78837C]">응답자를 선택하면 모든 답변을 바로 확인할 수 있어요.</p></div><button type="button" onClick={() => setView("individual")} className="text-xs font-semibold text-[#0B4D3D] underline underline-offset-2">전체 보기</button></div>
            <div className="divide-y divide-[#F0EEE6]">
              {recentResponses.map((response) => <button key={response.id} type="button" onClick={() => selectResponse(response.id)} className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors hover:bg-[#F8F9F4]"><span className="min-w-0"><span className="block truncate text-sm font-medium text-[#17251F]">{response.answers?._cokform_email || "이메일을 기록하지 않은 응답"}</span><span className="mt-0.5 block text-xs text-[#78837C]">{formatSubmittedAt(response.submittedAt)}</span></span><ChevronRight size={16} className="shrink-0 text-[#78837C]" /></button>)}
            </div>
          </section>
        </div>
      )}

      {view === "question" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#DDE1D9] bg-[#F8F9F4] px-4 py-3 text-xs leading-5 text-[#59645E]">선택형 질문은 분포를 확인하고, 자유 입력 답변은 <button type="button" onClick={() => setView("individual")} className="font-semibold text-[#0B4D3D] underline underline-offset-2">개별 응답</button>에서 원문을 확인하세요.</div>
          {responseQuestions.map((question) => {
            const values = responses.map((response) => response.answers[question.id]).filter((value) => value !== undefined && value !== "");
            return (
              <div key={question.id} className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`} style={{ borderLeft: `4px solid ${TYPE_COLORS[question.type] || MD.primary}` }}>
                <div className="mb-3 text-sm font-medium text-[#17251F]">{richTextToPlain(question.title) || "제목 없는 질문"}<span className="ml-2 text-xs font-normal text-[#78837C]">{TYPE_LABEL[question.type]}</span></div>
                {["radio", "dropdown", "privacy_consent"].includes(question.type) && <div>{question.options.map((option, index) => <Bar key={option} label={option} count={values.filter((value) => value === option).length} max={responses.length} color={CHART_PALETTE[index % CHART_PALETTE.length]} />)}</div>}
                {question.type === "checkbox" && <div>{question.options.map((option, index) => <Bar key={option} label={option} count={values.filter((value) => Array.isArray(value) && value.includes(option)).length} max={responses.length} color={CHART_PALETTE[index % CHART_PALETTE.length]} />)}</div>}
                {question.type === "scale" && <div>{Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, index) => question.scaleMin + index).map((number, index) => <Bar key={number} label={String(number)} count={values.filter((value) => value === number).length} max={responses.length} color={CHART_PALETTE[index % CHART_PALETTE.length]} />)}</div>}
                {["short", "paragraph", "date", "time"].includes(question.type) && <div className="flex items-center justify-between gap-3 rounded-lg bg-[#F8F9F4] px-3 py-2.5 text-sm text-[#59645E]"><span>자유 입력 답변 {values.length}건</span><button type="button" onClick={() => setView("individual")} className="shrink-0 text-xs font-semibold text-[#0B4D3D] underline underline-offset-2">원문 보기</button></div>}
              </div>
            );
          })}
        </div>
      )}

      {view === "individual" && selectedResponse && (
        <div className="space-y-4">
          <section className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h3 className="flex items-center gap-2 text-sm font-semibold text-[#17251F]"><ClipboardList size={16} className="text-[#17866D]" /> 개별 응답</h3><p className="mt-1 text-xs text-[#78837C]">응답자를 한 명씩 넘겨 보며 전체 답변을 확인하세요.</p></div>
              <button type="button" onClick={() => onDeleteResponse?.(selectedResponse)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#B3261E] hover:bg-[#FBE4E0]"><Trash2 size={14} /> 이 응답 삭제</button>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E7E5DC] pt-4">
              <div className="flex items-center gap-2">
                <button type="button" aria-label="이전 응답" disabled={selectedIndex === 0} onClick={() => setSelectedResponseId(responses[selectedIndex - 1].id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C9CEC6] text-[#59645E] hover:bg-[#F5F3EC] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={17} /></button>
                <span className="min-w-[5rem] text-center text-sm font-semibold text-[#17251F]">응답 {selectedIndex + 1} / {responses.length}</span>
                <button type="button" aria-label="다음 응답" disabled={selectedIndex >= responses.length - 1} onClick={() => setSelectedResponseId(responses[selectedIndex + 1].id)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#C9CEC6] text-[#59645E] hover:bg-[#F5F3EC] disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={17} /></button>
              </div>
              <select aria-label="볼 응답 선택" value={selectedResponse.id} onChange={(event) => setSelectedResponseId(event.target.value)} className="min-w-[12rem] rounded-lg border border-[#C9CEC6] bg-[#FFFDF8] px-3 py-2 text-xs text-[#17251F] outline-none focus:border-[#17866D]">
                {responses.map((response, index) => <option key={response.id} value={response.id}>응답 {index + 1} · {formatSubmittedAt(response.submittedAt)}</option>)}
              </select>
            </div>
          </section>

          <article className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}>
            <div className="mb-4 border-b border-[#E7E5DC] pb-4"><div className="text-sm font-semibold text-[#17251F]">제출 정보</div><div className="mt-1 text-xs text-[#78837C]">{formatSubmittedAt(selectedResponse.submittedAt)}</div></div>
            <dl className="space-y-3">
              {form.settings?.collectEmail && <div className="rounded-lg bg-[#F1FAF4] px-3 py-2.5"><dt className="text-[11px] font-semibold text-[#0B4D3D]">기록된 이메일</dt><dd className="mt-1 break-words text-sm text-[#17251F]">{formatAnswer(selectedResponse.answers?._cokform_email)}</dd></div>}
              {responseQuestions.map((question) => <div key={question.id} className="rounded-lg border border-[#E7E5DC] px-3 py-3"><dt className="text-[11px] font-semibold text-[#59645E]">{richTextToPlain(question.title) || "제목 없는 질문"}</dt><dd className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-[#17251F]">{formatAnswer(selectedResponse.answers?.[question.id])}</dd></div>)}
            </dl>
          </article>
        </div>
      )}
    </div>
  );
}
