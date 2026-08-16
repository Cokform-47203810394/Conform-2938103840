import { richTextToPlain } from "./sanitizeRichText";

function cell(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value === undefined || value === null ? "" : String(value);
}

export function responseRows(form, responses) {
  const questions = form.questions.filter((q) => q.type !== "privacy_notice");
  return responses.map((response, index) => {
    const row = { "응답 번호": index + 1, "제출 시각": response.submittedAt || "" };
    questions.forEach((q) => {
      row[richTextToPlain(q.title) || "제목 없는 질문"] = cell(response.answers?.[q.id]);
    });
    return row;
  });
}

function download(content, filename, type) {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadCsv(form, responses) {
  const rows = responseRows(form, responses);
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  download(csv, `${form.title || "cokform"}-응답.csv`, "text/csv;charset=utf-8");
}

export function downloadExcelCompatible(form, responses) {
  const rows = responseRows(form, responses);
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  download(html, `${form.title || "cokform"}-응답.xls`, "application/vnd.ms-excel;charset=utf-8");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
