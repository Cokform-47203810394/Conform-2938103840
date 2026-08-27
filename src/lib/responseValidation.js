const MAX_BLACKLIST_WORDS = 50;
const MAX_BLACKLIST_WORD_LENGTH = 80;

export function normalizeBlacklistWords(value) {
  const raw = Array.isArray(value) ? value : String(value || "").split(/[\n,]/);
  const seen = new Set();
  const words = [];

  raw.forEach((item) => {
    const word = String(item || "").replace(/\s+/g, " ").trim().slice(0, MAX_BLACKLIST_WORD_LENGTH);
    const key = word.normalize("NFKC").toLocaleLowerCase("ko-KR");
    if (!word || seen.has(key) || words.length >= MAX_BLACKLIST_WORDS) return;
    seen.add(key);
    words.push(word);
  });

  return words;
}

export function isBlacklistEnabledForQuestion(question, settings = {}) {
  const scope = settings.blacklistScope || "all";
  if (scope === "text") return ["short", "paragraph"].includes(question?.type);
  if (scope === "selected") return Array.isArray(settings.blacklistQuestionIds) && settings.blacklistQuestionIds.includes(question?.id);
  return true;
}

export function findBlacklistViolation(value, question, settings = {}) {
  if (!isBlacklistEnabledForQuestion(question, settings)) return null;
  const words = normalizeBlacklistWords(settings.blacklistWords);
  if (!words.length) return null;

  const answer = (Array.isArray(value) ? value.join(" ") : String(value ?? ""))
    .normalize("NFKC")
    .toLocaleLowerCase("ko-KR");
  if (!answer) return null;

  return words.find((word) => answer.includes(word.normalize("NFKC").toLocaleLowerCase("ko-KR"))) || null;
}

export const BLACKLIST_LIMITS = {
  maxWords: MAX_BLACKLIST_WORDS,
  maxWordLength: MAX_BLACKLIST_WORD_LENGTH,
};
