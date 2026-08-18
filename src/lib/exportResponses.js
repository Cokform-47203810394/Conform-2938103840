import { richTextToPlain } from "./sanitizeRichText";

function cell(value) {
  if (Array.isArray(value)) return value.join(", ");
  return value === undefined || value === null ? "" : String(value);
}

// Spreadsheet apps can treat leading formula characters as executable formulas.
// Exports must preserve respondent text as text, never as a spreadsheet instruction.
function safeSpreadsheetCell(value) {
  const text = cell(value);
  return /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
}

function safeFileName(value) {
  return (String(value || "cokform").trim().replace(/[\\/:*?"<>|]/g, "-") || "cokform").slice(0, 80);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Some browsers resolve a programmatic download after the current event loop.
  // Keep the object URL alive long enough so a fast revoke cannot cancel it.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function responseRows(form, responses) {
  const questions = form.questions.filter((q) => q.type !== "privacy_notice");
  return responses.map((response, index) => {
    const row = { "응답 번호": index + 1, "제출 시각": response.submittedAt || "" };
    if (form.settings?.collectEmail) row["이메일 주소"] = safeSpreadsheetCell(response.answers?._cokform_email);
    questions.forEach((q) => {
      row[richTextToPlain(q.title) || "제목 없는 질문"] = safeSpreadsheetCell(response.answers?.[q.id]);
    });
    return row;
  });
}

export function createCsvBlob(form, responses) {
  const rows = responseRows(form, responses);
  if (!rows.length) return null;
  const headers = Object.keys(rows[0]);
  const csv = [headers, ...rows.map((row) => headers.map((header) => row[header]))]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
  return new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
}

export function createExcelBlob(form, responses) {
  const rows = responseRows(form, responses);
  if (!rows.length) return null;
  const headers = Object.keys(rows[0]);
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${escapeHtml(row[h])}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`;
  return new Blob(["\ufeff", html], { type: "application/vnd.ms-excel;charset=utf-8" });
}

export function downloadCsv(form, responses) {
  const blob = createCsvBlob(form, responses);
  if (blob) downloadBlob(blob, `${safeFileName(form.title)}-응답.csv`);
}

export function downloadExcelCompatible(form, responses) {
  const blob = createExcelBlob(form, responses);
  if (blob) downloadBlob(blob, `${safeFileName(form.title)}-응답.xls`);
}

export function downloadJson(form, responses) {
  const payload = {
    exportedAt: new Date().toISOString(),
    form: {
      title: form.title,
      questions: form.questions.filter((q) => q.type !== "privacy_notice").map((q) => ({ id: q.id, title: richTextToPlain(q.title), type: q.type })),
    },
    responses: responseRows(form, responses),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `${safeFileName(form.title)}-응답.json`);
}

function answerSummary(question, responses) {
  const values = responses.map((r) => r.answers?.[question.id]).filter((value) => value !== undefined && value !== "");
  const title = richTextToPlain(question.title) || "제목 없는 질문";
  if (["radio", "dropdown", "privacy_consent", "checkbox"].includes(question.type)) {
    const counts = (question.options || []).map((option) => ({
      label: option,
      count: values.filter((value) => Array.isArray(value) ? value.includes(option) : value === option).length,
    }));
    return { title, type: "choice", count: values.length, counts };
  }
  if (question.type === "scale") {
    const counts = Array.from({ length: question.scaleMax - question.scaleMin + 1 }, (_, index) => question.scaleMin + index)
      .map((value) => ({ label: String(value), count: values.filter((answer) => Number(answer) === value).length }));
    return { title, type: "choice", count: values.length, counts };
  }
  return { title, type: "count", count: values.length, counts: [] };
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export async function createSummaryPngBlob(form, responses) {
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");

  ctx.fillStyle = "#F5F3EC";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#17251F";
  drawRoundedRect(ctx, 72, 68, 1456, 210, 34);
  ctx.fill();
  ctx.fillStyle = "#D8ED59";
  ctx.font = "700 20px sans-serif";
  ctx.fillText("콕폼 · 응답 요약", 120, 126);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 54px sans-serif";
  ctx.fillText(form.title || "제목 없는 설문지", 120, 202);
  ctx.fillStyle = "#D6E1D8";
  ctx.font = "400 24px sans-serif";
  ctx.fillText(`응답 ${responses.length.toLocaleString("ko-KR")}건 · ${new Date().toLocaleDateString("ko-KR")}`, 120, 242);

  const summaries = form.questions.filter((q) => q.type !== "privacy_notice").slice(0, 4).map((q) => answerSummary(q, responses));
  const cardWidth = 700;
  const cardHeight = 240;
  summaries.forEach((summary, index) => {
    const x = 72 + (index % 2) * 760;
    const y = 330 + Math.floor(index / 2) * 280;
    ctx.fillStyle = "#FFFFFF";
    drawRoundedRect(ctx, x, y, cardWidth, cardHeight, 28);
    ctx.fill();
    ctx.fillStyle = "#17866D";
    ctx.font = "700 18px sans-serif";
    ctx.fillText(`질문 ${index + 1}`, x + 34, y + 48);
    ctx.fillStyle = "#17251F";
    ctx.font = "700 28px sans-serif";
    const title = summary.title.length > 28 ? `${summary.title.slice(0, 28)}…` : summary.title;
    ctx.fillText(title, x + 34, y + 90);
    ctx.fillStyle = "#59645E";
    ctx.font = "400 20px sans-serif";
    ctx.fillText(`응답 ${summary.count.toLocaleString("ko-KR")}건`, x + 34, y + 126);

    if (summary.type === "choice") {
      const top = [...summary.counts].sort((a, b) => b.count - a.count).slice(0, 3);
      const max = Math.max(...top.map((item) => item.count), 1);
      top.forEach((item, row) => {
        const topY = y + 158 + row * 24;
        ctx.fillStyle = "#EAF6EF";
        drawRoundedRect(ctx, x + 34, topY, 440, 12, 6);
        ctx.fill();
        ctx.fillStyle = "#17866D";
        drawRoundedRect(ctx, x + 34, topY, 440 * (item.count / max), 12, 6);
        ctx.fill();
        ctx.fillStyle = "#59645E";
        ctx.font = "400 16px sans-serif";
        const label = item.label.length > 16 ? `${item.label.slice(0, 16)}…` : item.label;
        ctx.fillText(`${label} ${item.count}`, x + 490, topY + 12);
      });
    } else {
      ctx.fillStyle = "#F1FAF4";
      drawRoundedRect(ctx, x + 34, y + 158, 260, 42, 16);
      ctx.fill();
      ctx.fillStyle = "#0B4D3D";
      ctx.font = "600 18px sans-serif";
      ctx.fillText("원문은 내보내기 파일에서만 확인", x + 54, y + 185);
    }
  });

  ctx.fillStyle = "#78837C";
  ctx.font = "400 16px sans-serif";
  ctx.fillText("개인정보 원문은 이 요약 이미지에 포함되지 않습니다.", 72, 852);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("png_failed"))), "image/png"));
}

export async function downloadSummaryPng(form, responses) {
  const blob = await createSummaryPngBlob(form, responses);
  downloadBlob(blob, `${safeFileName(form.title)}-응답요약.png`);
}

export async function downloadPresentation(form, responses) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Cokform";
  pptx.subject = "콕폼 응답 요약";
  pptx.title = `${form.title || "콕폼"} 응답 요약`;
  pptx.company = "Cokform";
  pptx.lang = "ko-KR";
  pptx.theme = { headFontFace: "Malgun Gothic", bodyFontFace: "Malgun Gothic", lang: "ko-KR" };

  const cover = pptx.addSlide();
  cover.background = { color: "17251F" };
  cover.addText("콕폼 · 응답 요약", { x: 0.7, y: 0.65, w: 7, h: 0.3, fontFace: "Malgun Gothic", fontSize: 14, bold: true, color: "D8ED59" });
  cover.addText(form.title || "제목 없는 설문지", { x: 0.7, y: 1.3, w: 11.5, h: 0.9, fontFace: "Malgun Gothic", fontSize: 36, bold: true, color: "FFFFFF", breakLine: false, fit: "shrink" });
  cover.addText(`응답 ${responses.length.toLocaleString("ko-KR")}건 · ${new Date().toLocaleDateString("ko-KR")}`, { x: 0.7, y: 2.45, w: 8, h: 0.4, fontFace: "Malgun Gothic", fontSize: 16, color: "D6E1D8" });
  cover.addText("개인정보 원문은 이 프레젠테이션에 포함되지 않습니다.", { x: 0.7, y: 6.7, w: 8, h: 0.3, fontFace: "Malgun Gothic", fontSize: 10, color: "9DAAA1" });

  const summaries = form.questions.filter((q) => q.type !== "privacy_notice").map((q) => answerSummary(q, responses));
  summaries.slice(0, 8).forEach((summary, index) => {
    const slide = pptx.addSlide();
    slide.background = { color: "F5F3EC" };
    slide.addText(`질문 ${index + 1}`, { x: 0.7, y: 0.5, w: 3, h: 0.3, fontFace: "Malgun Gothic", fontSize: 12, bold: true, color: "17866D", charSpace: 1 });
    slide.addText(summary.title, { x: 0.7, y: 0.92, w: 11.4, h: 0.65, fontFace: "Malgun Gothic", fontSize: 27, bold: true, color: "17251F", fit: "shrink" });
    slide.addText(`응답 ${summary.count.toLocaleString("ko-KR")}건`, { x: 0.7, y: 1.72, w: 4, h: 0.35, fontFace: "Malgun Gothic", fontSize: 15, color: "59645E" });
    if (summary.type === "choice") {
      const top = [...summary.counts].sort((a, b) => b.count - a.count).slice(0, 6);
      const max = Math.max(...top.map((item) => item.count), 1);
      top.forEach((item, row) => {
        const y = 2.35 + row * 0.58;
        slide.addText(item.label || "응답 없음", { x: 0.9, y, w: 3.2, h: 0.25, fontFace: "Malgun Gothic", fontSize: 13, color: "17251F", fit: "shrink" });
        slide.addShape(pptx.ShapeType.roundRect, { x: 4.25, y: y + 0.04, w: 5.4, h: 0.2, rectRadius: 0.04, fill: { color: "EAF6EF" }, line: { color: "EAF6EF" } });
        slide.addShape(pptx.ShapeType.roundRect, { x: 4.25, y: y + 0.04, w: 5.4 * (item.count / max), h: 0.2, rectRadius: 0.04, fill: { color: "17866D" }, line: { color: "17866D" } });
        slide.addText(String(item.count), { x: 9.9, y: y - 0.02, w: 0.5, h: 0.3, fontFace: "Malgun Gothic", fontSize: 13, bold: true, color: "17251F", align: "right" });
      });
    } else {
      slide.addShape(pptx.ShapeType.roundRect, { x: 0.9, y: 2.45, w: 5.1, h: 1.25, rectRadius: 0.12, fill: { color: "FFFFFF" }, line: { color: "DDE1D9" } });
      slide.addText("자유 입력 응답", { x: 1.25, y: 2.78, w: 2, h: 0.3, fontFace: "Malgun Gothic", fontSize: 15, bold: true, color: "17251F" });
      slide.addText(`${summary.count.toLocaleString("ko-KR")}건`, { x: 1.25, y: 3.14, w: 2, h: 0.35, fontFace: "Malgun Gothic", fontSize: 22, bold: true, color: "17866D" });
      slide.addText("개인정보 원문은 포함하지 않았습니다.", { x: 0.9, y: 4.1, w: 4.5, h: 0.3, fontFace: "Malgun Gothic", fontSize: 12, color: "78837C" });
    }
    slide.addText("Cokform · 개인정보 원문 미포함 요약", { x: 0.7, y: 6.9, w: 5, h: 0.2, fontFace: "Malgun Gothic", fontSize: 9, color: "78837C" });
  });

  await pptx.writeFile({ fileName: `${safeFileName(form.title)}-응답요약.pptx` });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
