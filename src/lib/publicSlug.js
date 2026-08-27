export const RESERVED_PUBLIC_SLUGS = new Set([
  "privacy",
  "terms",
  "sitemap",
  "docs",
  "resources",
  "international-transfer",
  "service-restrictions",
  "business-info",
  "after-hours",
  "status",
]);

const MAX_SLUG_LENGTH = 48;
const PUBLIC_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizePublicSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validatePublicSlug(value) {
  const slug = normalizePublicSlug(value);
  if (!slug) return { slug: "", error: "" };
  if (slug.length < 3 || slug.length > MAX_SLUG_LENGTH) {
    return { slug, error: `주소는 3~${MAX_SLUG_LENGTH}자로 설정해 주세요.` };
  }
  if (!PUBLIC_SLUG_PATTERN.test(slug)) {
    return { slug, error: "영문 소문자, 숫자, 하이픈(-)만 사용할 수 있어요." };
  }
  if (RESERVED_PUBLIC_SLUGS.has(slug)) {
    return { slug, error: "콕폼 기본 페이지에서 사용하는 주소예요. 다른 주소를 입력해 주세요." };
  }
  return { slug, error: "" };
}

export function getPublicFormPath(slug, fallbackFormId) {
  const normalized = validatePublicSlug(slug);
  if (!normalized.error && normalized.slug) return `/${normalized.slug}`;
  return fallbackFormId ? `/?respond=${encodeURIComponent(fallbackFormId)}` : "/";
}

export function getPublicFormUrl(origin, slug, fallbackFormId) {
  return `${origin || ""}${getPublicFormPath(slug, fallbackFormId)}`;
}

export function isPublicSlugPath(pathname) {
  const path = String(pathname || "").replace(/^\/+|\/+$/g, "");
  const { slug, error } = validatePublicSlug(path);
  return !error && Boolean(slug) ? slug : null;
}
