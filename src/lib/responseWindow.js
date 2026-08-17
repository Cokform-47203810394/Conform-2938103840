function parseTimestamp(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

/**
 * Determines the public response availability from persisted ISO timestamps.
 * The database RLS policy mirrors this rule for the final submission guard.
 */
export function getResponseWindowState(settings = {}, now = Date.now()) {
  if (settings?.acceptingResponses === false) return "manually_closed";
  const startAt = parseTimestamp(settings?.responseStartAt);
  const endAt = parseTimestamp(settings?.responseEndAt);
  if (startAt !== null && now < startAt) return "not_started";
  if (endAt !== null && now >= endAt) return "ended";
  return "open";
}

export function getResponseWindowMessage(state, settings = {}) {
  if (state === "manually_closed") return "작성자가 현재 응답을 마감했어요.";
  if (state === "not_started") return `응답은 ${formatResponseDateTime(settings?.responseStartAt)}부터 받을 수 있어요.`;
  if (state === "ended") return `응답 기간이 ${formatResponseDateTime(settings?.responseEndAt)}에 마감됐어요.`;
  return "응답을 받고 있어요.";
}

export function formatResponseDateTime(value) {
  const timestamp = parseTimestamp(value);
  if (timestamp === null) return "설정된 시각";
  return new Date(timestamp).toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Convert an ISO timestamp into the local value expected by datetime-local. */
export function toDateTimeLocalValue(value) {
  const timestamp = parseTimestamp(value);
  if (timestamp === null) return "";
  const date = new Date(timestamp - new Date(timestamp).getTimezoneOffset() * 60_000);
  return date.toISOString().slice(0, 16);
}

export function fromDateTimeLocalValue(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}
