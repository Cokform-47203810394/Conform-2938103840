import { Trash2 } from "lucide-react";
import { IconButton } from "./Primitives";
import Bar from "./Bar";
import { MD, TYPE_COLORS, CHART_PALETTE, ELEV1 } from "../theme";
import { TYPE_LABEL } from "../questionTypes";
import { richTextToPlain } from "../lib/sanitizeRichText";

export default function ResponsesView({ form, responses, onClear }) {
  if (responses.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-[#CAC4D0] bg-white p-12 text-center text-sm text-[#79747E]">
        아직 응답이 없습니다. 미리보기 탭에서 제출해보세요.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className={`flex items-center justify-between rounded-xl bg-white p-4 sm:p-5 ${ELEV1}`}>
        <div>
          <div className="font-mono text-2xl font-bold text-[#1C1B1F]">{responses.length}</div>
          <div className="text-xs text-[#79747E]">개 응답</div>
        </div>
        <IconButton title="응답 전체 삭제" onClick={onClear} danger>
          <Trash2 size={16} />
        </IconButton>
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
            <div className="mb-3 text-sm font-medium text-[#1C1B1F]">
              {richTextToPlain(q.title) || "제목 없는 질문"}
              <span className="ml-2 text-xs font-normal text-[#79747E]">{TYPE_LABEL[q.type]}</span>
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
              <ul className="space-y-1.5 text-sm text-[#49454F]">
                {values.map((v, i) => (
                  <li key={i} className="border-b border-[#F3EDF7] pb-1.5 last:border-0">
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
