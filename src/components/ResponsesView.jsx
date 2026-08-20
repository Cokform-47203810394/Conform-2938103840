import { useMemo, useState } from "react";
import { ChevronDown, Download, FileJson, FileSpreadsheet, ImageDown, LoaderCircle, Presentation, Search, Table2, Trash2, Upload } from "lucide-react";
import { createCsvBlob, createExcelBlob, createSummaryPngBlob, downloadCsv, downloadExcelCompatible, downloadJson, downloadPresentation, downloadSummaryPng } from "../lib/exportResponses";
import { getGoogleDriveAccessToken, requestGoogleDriveAccess, uploadGoogleDriveFile } from "../lib/googleDriveExport";
import { TYPE_LABEL } from "../questionTypes";
import { richTextToPlain } from "../lib/sanitizeRichText";

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

const WORKFLOW_OPTIONS = [
  ["new", "확인 전"],
  ["reviewing", "검토 중"],
  ["in_progress", "처리 중"],
  ["done", "처리 완료"],
  ["archived", "보관"],
];

function workflowLabel(status) {
  return WORKFLOW_OPTIONS.find(([value]) => value === status)?.[1] || "확인 전";
}

function workflowClass(status) {
  return {
    new: "bg-[#FFF4D8] text-[#765C05]",
    reviewing: "bg-[#EAF1FB] text-[#275D9B]",
    in_progress: "bg-[#F1EAFE] text-[#6447A7]",
    done: "bg-[#EAF6EF] text-[#0B4D3D]",
    archived: "bg-[#F1F2EF] text-[#59645E]",
  }[status] || "bg-[#FFF4D8] text-[#765C05]";
}

function workflowBorder(status) {
  return {
    new: "#D6B449",
    reviewing: "#79A8DD",
    in_progress: "#A68ADD",
    done: "#73B99D",
    archived: "#B9C0B9",
  }[status] || "#D6B449";
}

function respondentLabel(response, questions, index) {
  const email = response.answers?._cokform_email;
  if (typeof email === "string" && email.trim()) return email.trim();
  const firstIdentity = questions.find((question) => question.type === "short" && response.answers?.[question.id]);
  if (firstIdentity) return formatAnswer(response.answers[firstIdentity.id]);
  return `응답자 ${index + 1}`;
}

export default function ResponsesView({ form, formId, responses, onClear, onDeleteResponse, onUpdateWorkflow, onAudit }) {
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState("");
  const [exportNotice, setExportNotice] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [responseQuery, setResponseQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const responseQuestions = useMemo(
    () => form.questions.filter((question) => question.type !== "privacy_notice" && question.type !== "section"),
    [form.questions],
  );

  const filteredResponses = useMemo(() => {
    const query = responseQuery.trim().toLowerCase();
    return responses.filter((response) => {
      const matchesStatus = statusFilter === "all" || (response.status || "new") === statusFilter;
      if (!matchesStatus) return false;
      if (!query) return true;
      const searchable = [
        response.answers?._cokform_email,
        response.submittedAt,
        ...Object.values(response.answers || {}).flatMap((value) => Array.isArray(value) ? value : [value]),
      ].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [responses, responseQuery, statusFilter]);

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
      <div className="border-y-2 border-dashed border-[#C9CEC6] py-12 text-center text-sm text-[#78837C]">
        아직 제출 기록이 없습니다. 공유 링크로 들어온 응답은 제출자·내용·처리 상태를 한 번에 이곳에서 확인할 수 있어요.
      </div>
    );
  }

  const records = [...filteredResponses].reverse();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[#DDE1D9] py-4 sm:py-5">
        <div>
          <div className="text-sm font-medium text-[#17251F]">제출 기록</div>
          <p className="mt-1 text-xs text-[#78837C]">누가 무엇을 제출했고, 지금 어디까지 처리했는지 한 번에 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="cok-number text-sm font-normal text-[#59645E]">총 {responses.length}건</span>
          <div className="relative">
            <button
              type="button"
              aria-expanded={exportOpen}
              onClick={() => setExportOpen((open) => !open)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#C9CEC6] bg-[#FFFDF8] px-3 py-2 text-xs font-medium text-[#59645E] transition-colors hover:bg-white"
            >
              <Download size={14} /> 내보내기 <ChevronDown size={14} className={exportOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {exportOpen && <button type="button" aria-label="내보내기 메뉴 닫기" onClick={() => setExportOpen(false)} className="fixed inset-0 z-30 cursor-default" />}
            {exportOpen && (
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-1.5rem))] border border-[#DDE1D9] bg-[#FFFDF8] p-3 shadow-[0_10px_24px_rgba(23,37,31,0.12)]">
                <p className="px-1 pb-2 text-[11px] leading-5 text-[#78837C]">CSV·Excel·JSON에는 응답 원문이 들어갑니다. 집계 요약 PNG·PPTX에는 개인정보·자유 입력 원문을 기본으로 넣지 않습니다.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => exportLocal("csv", () => downloadCsv(form, responses))} className="export-button"><Download size={14} /> CSV 원문</button>
                  <button type="button" onClick={() => exportLocal("excel", () => downloadExcelCompatible(form, responses))} className="export-button"><FileSpreadsheet size={14} /> Excel 원문</button>
                  <button type="button" onClick={() => exportLocal("json", () => downloadJson(form, responses))} className="export-button"><FileJson size={14} /> JSON 원문</button>
                  <button type="button" onClick={() => exportLocal("summary_png", () => downloadSummaryPng(form, responses))} className="export-button"><ImageDown size={14} /> 집계 요약 PNG</button>
                  <button type="button" onClick={() => exportLocal("summary_pptx", () => downloadPresentation(form, responses))} className="export-button col-span-2"><Presentation size={14} /> 집계 요약 PPTX</button>
                </div>
                <div className="my-3 border-t border-[#E7E5DC]" />
                <p className="px-1 pb-2 text-[11px] font-medium text-[#59645E]">Google Workspace</p>
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
          <button type="button" onClick={onClear} className="inline-flex min-h-10 items-center gap-1.5 px-2 text-xs font-medium text-[#B3261E] transition-colors hover:bg-[#FBE4E0]" title="응답 전체 삭제"><Trash2 size={15} /> 전체 삭제</button>
        </div>
      </div>

      {exportNotice && <div role="status" className="border-l-2 border-[#73B99D] bg-[#F1FAF4] px-3 py-2.5 text-xs leading-5 text-[#355C45]">{exportNotice}{driveUrl && <> <a href={driveUrl} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">Drive에서 열기</a></>}</div>}

      <div className="grid gap-2 border-y border-[#DDE1D9] py-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <label className="relative block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#78837C]" />
          <input value={responseQuery} onChange={(event) => setResponseQuery(event.target.value)} placeholder="이름, 이메일, 답변 내용으로 찾기" className="w-full rounded-lg border border-[#C9CEC6] bg-[#FFFDF8] py-2 pl-9 pr-3 text-sm text-[#17251F] outline-none focus:border-[#17866D]" />
        </label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-[#C9CEC6] bg-[#FFFDF8] px-3 py-2 text-sm text-[#17251F] outline-none focus:border-[#17866D]">
          <option value="all">모든 처리 상태</option>
          {WORKFLOW_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {(responseQuery || statusFilter !== "all") && <div className="sm:col-span-2 flex items-center justify-between gap-2 px-1 text-xs text-[#59645E]"><span className="cok-number">{filteredResponses.length}건 표시 중</span><button type="button" onClick={() => { setResponseQuery(""); setStatusFilter("all"); }} className="font-medium text-[#0B4D3D] underline underline-offset-2">필터 초기화</button></div>}
      </div>

      {records.length ? (
        <section aria-label="응답자별 제출 기록" className="border-b border-[#DDE1D9]">
          {records.map((response) => {
            const originalIndex = responses.findIndex((item) => item.id === response.id);
            const status = response.status || "new";
            return (
              <article key={response.id} className="border-t-2 px-1 py-5 sm:px-4" style={{ borderTopColor: workflowBorder(status) }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-medium tracking-[-0.015em] text-[#17251F]">{respondentLabel(response, responseQuestions, originalIndex)}</h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#78837C]"><span className="cok-number">응답 {originalIndex + 1}</span><span>·</span><span>{formatSubmittedAt(response.submittedAt)} 제출</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`response-status-${response.id}`}>처리 상태</label>
                    <select id={`response-status-${response.id}`} value={status} onChange={(event) => onUpdateWorkflow?.(response, event.target.value)} className={`min-h-9 rounded-full px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-[#17866D]/30 ${workflowClass(status)}`}>
                      {WORKFLOW_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                    <button type="button" onClick={() => onDeleteResponse?.(response)} className="inline-flex h-9 w-9 items-center justify-center text-[#B3261E] transition-colors hover:bg-[#FBE4E0]" title="이 응답 삭제"><Trash2 size={15} /></button>
                  </div>
                </div>

                <dl className="mt-4 grid gap-x-8 border-t border-[#E7E5DC] pt-3 sm:grid-cols-2">
                  {responseQuestions.map((question) => (
                    <div key={question.id} className="border-b border-[#F0EEE6] py-3 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0">
                      <dt className="text-[11px] font-normal text-[#78837C]">{richTextToPlain(question.title) || "제목 없는 질문"} <span className="ml-1 text-[#A2AAA3]">{TYPE_LABEL[question.type]}</span></dt>
                      <dd className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-6 text-[#17251F]">{formatAnswer(response.answers?.[question.id])}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </section>
      ) : (
        <div className="border-y border-dashed border-[#C9CEC6] py-10 text-center text-sm text-[#78837C]">지금 조건에 맞는 제출 기록이 없습니다.</div>
      )}
    </div>
  );
}
