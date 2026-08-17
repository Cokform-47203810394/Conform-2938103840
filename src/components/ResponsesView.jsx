import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, ImageDown, LoaderCircle, Presentation, Table2, Trash2, Upload } from "lucide-react";
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

export default function ResponsesView({ form, formId, responses, onClear }) {
  const [exporting, setExporting] = useState("");
  const [exportNotice, setExportNotice] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  const exportToDrive = async (target) => {
    setDriveUrl("");
    setExportNotice("");
    setExporting(target);
    try {
      const accessToken = await getGoogleDriveAccessToken();
      if (!accessToken) {
        setExportNotice("Google Drive 권한이 필요해요. Google 동의 화면에서 파일 생성 권한만 허용하면 현재 폼으로 다시 돌아옵니다.");
        await requestGoogleDriveAccess(formId);
        return;
      }

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
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setExportNotice("Google 권한이 만료됐거나 아직 설정되지 않았어요. 다시 연결한 뒤 시도해주세요.");
      } else {
        setExportNotice("내보내기 파일을 Google Drive로 보내지 못했어요. 네트워크와 권한을 확인해주세요.");
      }
    } finally {
      setExporting("");
    }
  };

  if (responses.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#C9CEC6] bg-white p-12 text-center text-sm text-[#78837C]">
        아직 응답이 없습니다. 미리보기 탭에서 제출해보세요.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}>
        <div>
          <div className="font-mono text-2xl font-bold text-[#17251F]">{responses.length}</div>
          <div className="text-xs text-[#78837C]">개 응답</div>
        </div>
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-[#C9CEC6] bg-white px-2.5 py-2 text-xs font-semibold text-[#59645E] transition-colors hover:bg-[#F5F3EC] [&::-webkit-details-marker]:hidden"><Download size={14} /> 내보내기</summary>
            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-[#DDE1D9] bg-[#FFFDF8] p-3 shadow-[0_12px_30px_rgba(23,37,31,0.16)]">
              <p className="px-1 pb-2 text-[11px] leading-5 text-[#78837C]">원문이 포함되는 파일은 이 기기에서 직접 생성됩니다. 요약 PNG·PPTX에는 자유 입력 원문을 넣지 않습니다.</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => downloadCsv(form, responses)} className="export-button"><Download size={14} /> CSV</button>
                <button type="button" onClick={() => downloadExcelCompatible(form, responses)} className="export-button"><FileSpreadsheet size={14} /> Excel</button>
                <button type="button" onClick={() => downloadJson(form, responses)} className="export-button"><FileJson size={14} /> JSON</button>
                <button type="button" onClick={() => downloadSummaryPng(form, responses).catch(() => setExportNotice("요약 이미지를 만들지 못했어요."))} className="export-button"><ImageDown size={14} /> 요약 PNG</button>
                <button type="button" onClick={() => downloadPresentation(form, responses).catch(() => setExportNotice("프레젠테이션을 만들지 못했어요."))} className="export-button col-span-2"><Presentation size={14} /> 응답 요약 PPTX</button>
              </div>
              <div className="my-3 border-t border-[#E7E5DC]" />
              <p className="px-1 pb-2 text-[11px] font-semibold text-[#59645E]">Google Workspace로 직접 보내기</p>
              <div className="grid grid-cols-1 gap-2">
                <button type="button" onClick={() => exportToDrive("sheets")} disabled={Boolean(exporting)} className="export-button"><Table2 size={14} /> {exporting === "sheets" ? <LoaderCircle className="animate-spin" size={14} /> : null} Google Sheets로 보내기</button>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => exportToDrive("excel")} disabled={Boolean(exporting)} className="export-button"><Upload size={14} /> {exporting === "excel" ? <LoaderCircle className="animate-spin" size={14} /> : null} Drive Excel</button>
                  <button type="button" onClick={() => exportToDrive("image")} disabled={Boolean(exporting)} className="export-button"><Upload size={14} /> {exporting === "image" ? <LoaderCircle className="animate-spin" size={14} /> : null} Drive PNG</button>
                </div>
              </div>
              {exportNotice && <div role="status" className="mt-3 rounded-xl bg-[#EAF6EF] px-3 py-2 text-[11px] leading-5 text-[#355C45]">{exportNotice}{driveUrl && <> <a href={driveUrl} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">Drive에서 열기</a></>}</div>}
            </div>
          </details>
          <IconButton title="응답 전체 삭제" onClick={onClear} danger>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      {form.questions.map((q) => {
        if (q.type === "privacy_notice") return null;
        const values = responses.map((r) => r.answers[q.id]).filter((v) => v !== undefined && v !== "");
        return (
          <div
            key={q.id}
            className={`rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}
            style={{ borderLeft: `4px solid ${TYPE_COLORS[q.type] || MD.primary}` }}
          >
            <div className="mb-3 text-sm font-medium text-[#17251F]">
              {richTextToPlain(q.title) || "제목 없는 질문"}
              <span className="ml-2 text-xs font-normal text-[#78837C]">{TYPE_LABEL[q.type]}</span>
            </div>

            {["radio", "dropdown", "privacy_consent"].includes(q.type) && (
              <div>
                {q.options.map((opt, i) => {
                  const c = values.filter((v) => v === opt).length;
                  return <Bar key={opt} label={opt} count={c} max={responses.length} color={CHART_PALETTE[i % CHART_PALETTE.length]} />;
                })}
              </div>
            )}

            {q.type === "checkbox" && (
              <div>
                {q.options.map((opt, i) => {
                  const c = values.filter((v) => Array.isArray(v) && v.includes(opt)).length;
                  return <Bar key={opt} label={opt} count={c} max={responses.length} color={CHART_PALETTE[i % CHART_PALETTE.length]} />;
                })}
              </div>
            )}

            {q.type === "scale" && (
              <div>
                {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, i) => q.scaleMin + i).map((n, i) => {
                  const c = values.filter((v) => v === n).length;
                  return <Bar key={n} label={String(n)} count={c} max={responses.length} color={CHART_PALETTE[i % CHART_PALETTE.length]} />;
                })}
              </div>
            )}

            {["short", "paragraph", "date", "time"].includes(q.type) && (
              <ul className="space-y-1.5 text-sm text-[#59645E]">
                {values.map((v, i) => <li key={i} className="border-b border-[#F5F3EC] pb-1.5 last:border-0">{v}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
