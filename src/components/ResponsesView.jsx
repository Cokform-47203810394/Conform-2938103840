import { Download, FileSpreadsheet, Trash2 } from "lucide-react";
import { IconButton } from "./Primitives";
import Bar from "./Bar";
import { MD, TYPE_COLORS, CHART_PALETTE, ELEV1 } from "../theme";
import { TYPE_LABEL } from "../questionTypes";
import { richTextToPlain } from "../lib/sanitizeRichText";
import { downloadCsv, downloadExcelCompatible } from "../lib/exportResponses";

export default function ResponsesView({ form, responses, onClear }) {
  if (responses.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#C9CEC6] bg-white p-12 text-center text-sm text-[#78837C]">
        아직 응답이 없습니다. 미리보기 탭에서 제출해보세요.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`flex items-center justify-between rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}>
        <div>
          <div className="font-mono text-2xl font-bold text-[#17251F]">{responses.length}</div>
          <div className="text-xs text-[#78837C]">개 응답</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="CSV 다운로드"
            onClick={() => downloadCsv(form, responses)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9CEC6] px-2.5 py-2 text-xs font-medium text-[#59645E] hover:bg-[#F5F3EC]"
          >
            <Download size={14} /> CSV
          </button>
          <button
            type="button"
            title="Excel 호환 파일 다운로드"
            onClick={() => downloadExcelCompatible(form, responses)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C9CEC6] px-2.5 py-2 text-xs font-medium text-[#59645E] hover:bg-[#F5F3EC]"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <IconButton title="응답 전체 삭제" onClick={onClear} danger>
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      {form.questions.map((q) => {
        if (q.type === "privacy_notice") return null; // 응답값 없음, 통계 제외
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
                  return (
                    <Bar
                      key={opt}
                      label={opt}
                      count={c}
                      max={responses.length}
                      color={CHART_PALETTE[i % CHART_PALETTE.length]}
                    />
                  );
                })}
              </div>
            )}

            {q.type === "checkbox" && (
              <div>
                {q.options.map((opt, i) => {
                  const c = values.filter((v) => Array.isArray(v) && v.includes(opt)).length;
                  return (
                    <Bar
                      key={opt}
                      label={opt}
                      count={c}
                      max={responses.length}
                      color={CHART_PALETTE[i % CHART_PALETTE.length]}
                    />
                  );
                })}
              </div>
            )}

            {q.type === "scale" && (
              <div>
                {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, i) => q.scaleMin + i).map((n, i) => {
                  const c = values.filter((v) => v === n).length;
                  return (
                    <Bar
                      key={n}
                      label={String(n)}
                      count={c}
                      max={responses.length}
                      color={CHART_PALETTE[i % CHART_PALETTE.length]}
                    />
                  );
                })}
              </div>
            )}

            {["short", "paragraph", "date", "time"].includes(q.type) && (
              <ul className="space-y-1.5 text-sm text-[#59645E]">
                {values.map((v, i) => (
                  <li key={i} className="border-b border-[#F5F3EC] pb-1.5 last:border-0">
                    {v}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
