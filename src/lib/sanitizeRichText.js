// Rich-text titles are authored via contentEditable and can end up on a public
// respond page that other people load. Anything pasted in (not just typed) could
// carry arbitrary HTML, so we allowlist-filter before ever storing or rendering it.
const ALLOWED_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "S", "STRIKE", "BR"]);

export function sanitizeRichText(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  clean(doc.body);
  return doc.body.innerHTML;
}

function clean(node) {
  [...node.childNodes].forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        // unwrap: keep the text/children, drop the disallowed wrapper (e.g. <script>, <a>, <div>)
        while (child.firstChild) node.insertBefore(child.firstChild, child);
        node.removeChild(child);
        return;
      }
      // strip all attributes — we only ever want the tag itself, no href/onclick/style/etc.
      [...child.attributes].forEach((attr) => child.removeAttribute(attr.name));
      clean(child);
    }
  });
}

// plain-text fallback for contexts that can't render HTML (thumbnails, alerts, titles)
export function richTextToPlain(html) {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

// Form descriptions are public content. Permit only local paths, HTTPS images, or
// small raster data URLs so custom image fields cannot become an unexpected URL scheme.
export function sanitizeImageSource(value) {
  const source = String(value || "").trim();
  if (!source || source.length > 3_000_000) return "";
  if (/^data:image\/(png|jpeg|gif|webp);base64,[a-z0-9+/=]+$/i.test(source)) return source;
  if (source.startsWith("/") && !source.startsWith("//")) return source;
  try {
    const url = new URL(source);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}
