import { Fragment } from "react";
import { sanitizeImageSource } from "../lib/sanitizeRichText";

const URL_PATTERN = /^(https:\/\/[^\s]+|\/[a-zA-Z0-9_./?=&%#-]*)$/;

function safeHref(value) {
  const source = String(value || "").trim();
  return URL_PATTERN.test(source) ? source : "";
}

function inlineNodes(source, keyPrefix = "inline") {
  const text = String(source || "");
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\|\|[^|]+\|\||`[^`]+`|\[[^\]]+\]\((?:https:\/\/|\/)[^)]+\)|\*[^*]+\*|_[^_]+_)/g;
  const nodes = [];
  let cursor = 0;
  let match;
  let index = 0;

  const pushText = (value) => {
    if (value) nodes.push(value);
  };

  while ((match = pattern.exec(text))) {
    pushText(text.slice(cursor, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;

    if (token.startsWith("**")) nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    else if (token.startsWith("__")) nodes.push(<span key={key} className="underline underline-offset-2">{token.slice(2, -2)}</span>);
    else if (token.startsWith("~~")) nodes.push(<s key={key}>{token.slice(2, -2)}</s>);
    else if (token.startsWith("||")) nodes.push(<span key={key} className="rounded bg-[#59645E] px-1 text-transparent transition hover:bg-[#E7E5DC] hover:text-[#17251F] focus-within:bg-[#E7E5DC] focus-within:text-[#17251F]">{token.slice(2, -2)}</span>);
    else if (token.startsWith("`")) nodes.push(<code key={key} className="rounded bg-[#E7E5DC] px-1.5 py-0.5 font-mono text-[0.92em] text-[#355C45]">{token.slice(1, -1)}</code>);
    else if (token.startsWith("[")) {
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const href = safeHref(token.slice(close + 2, -1));
      nodes.push(href ? <a key={key} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} className="font-medium text-[#0B4D3D] underline decoration-[#6EAA8A] underline-offset-2 hover:text-[#17866D]">{label}</a> : token);
    } else if (token.startsWith("*")) nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    else if (token.startsWith("_")) nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    cursor = match.index + token.length;
  }
  pushText(text.slice(cursor));
  return nodes;
}

function MarkdownImage({ alt, source, align = "center", width = "full" }) {
  const src = sanitizeImageSource(source);
  if (!src) return null;
  const widthClass = width === "small" ? "max-w-sm" : width === "medium" ? "max-w-xl" : "max-w-none";
  const alignClass = align === "left" ? "mr-auto" : align === "right" ? "ml-auto" : "mx-auto";
  return <img src={src} alt={alt || "설명 이미지"} className={`my-4 h-auto w-full rounded-lg object-cover ${widthClass} ${alignClass}`} />;
}

// This intentionally renders Markdown as React nodes rather than accepting HTML.
// Raw HTML stays plain text, so public form descriptions cannot inject scripts,
// attributes, iframes, or unexpected URL schemes.
export default function MarkdownContent({ content, className = "", style, image, imagePosition = "center", imageWidth = "full", imagePlacement = "below" }) {
  const lines = String(content || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push(<pre key={`code-${index}`} className="my-3 overflow-x-auto rounded-lg bg-[#17251F] p-3 text-xs leading-6 text-[#F4F6F2]"><code>{codeLines.join("\n")}</code></pre>);
      continue;
    }

    const imageMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      blocks.push(<MarkdownImage key={`image-${index}`} alt={imageMatch[1]} source={imageMatch[2]} align={imagePosition} width={imageWidth} />);
      index += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={`rule-${index}`} className="my-4 border-[#DDE1D9]" />);
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const Tag = `h${heading[1].length}`;
      const sizeClass = heading[1].length === 1 ? "text-2xl font-bold tracking-[-0.04em]" : heading[1].length === 2 ? "text-xl font-bold tracking-[-0.03em]" : "text-base font-semibold";
      blocks.push(<Tag key={`heading-${index}`} className={`mt-5 first:mt-0 ${sizeClass}`}>{inlineNodes(heading[2], `heading-${index}`)}</Tag>);
      index += 1;
      continue;
    }

    if (line.startsWith(">>>")) {
      const quote = [line.slice(3).trim()];
      index += 1;
      while (index < lines.length && lines[index].trim()) quote.push(lines[index++]);
      blocks.push(<blockquote key={`quote-${index}`} className="my-3 border-l-2 border-[#6EAA8A] pl-3 text-[#59645E]">{quote.map((item, quoteIndex) => <Fragment key={quoteIndex}>{inlineNodes(item, `quote-${index}-${quoteIndex}`)}{quoteIndex < quote.length - 1 && <br />}</Fragment>)}</blockquote>);
      continue;
    }

    if (line.startsWith(">")) {
      blocks.push(<blockquote key={`quote-${index}`} className="my-3 border-l-2 border-[#6EAA8A] pl-3 text-[#59645E]">{inlineNodes(line.slice(1).trim(), `quote-${index}`)}</blockquote>);
      index += 1;
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      const items = [];
      while (index < lines.length) {
        const current = lines[index].match(/^[-*]\s+(.+)$/);
        if (!current) break;
        items.push(current[1]);
        index += 1;
      }
      blocks.push(<ul key={`list-${index}`} className="my-3 list-disc space-y-1 pl-5">{items.map((item, itemIndex) => <li key={itemIndex}>{inlineNodes(item, `bullet-${index}-${itemIndex}`)}</li>)}</ul>);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      const items = [];
      while (index < lines.length) {
        const current = lines[index].match(/^\d+\.\s+(.+)$/);
        if (!current) break;
        items.push(current[1]);
        index += 1;
      }
      blocks.push(<ol key={`ordered-${index}`} className="my-3 list-decimal space-y-1 pl-5">{items.map((item, itemIndex) => <li key={itemIndex}>{inlineNodes(item, `ordered-${index}-${itemIndex}`)}</li>)}</ol>);
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(#{1,3})\s+|^```|^!\[|^---+$|^>>>|^>|^[-*]\s+|^\d+\.\s+/.test(lines[index])) {
      paragraph.push(lines[index++]);
    }
    blocks.push(<p key={`paragraph-${index}`} className="my-2 first:mt-0">{paragraph.map((item, paragraphIndex) => <Fragment key={paragraphIndex}>{inlineNodes(item, `paragraph-${index}-${paragraphIndex}`)}{paragraphIndex < paragraph.length - 1 && <br />}</Fragment>)}</p>);
  }

  return (
    <div className={`break-words leading-6 ${className}`} style={style}>
      {image?.src && imagePlacement === "above" && <MarkdownImage alt={image.alt} source={image.src} align={imagePosition} width={imageWidth} />}
      {blocks}
      {image?.src && imagePlacement !== "above" && <MarkdownImage alt={image.alt} source={image.src} align={imagePosition} width={imageWidth} />}
    </div>
  );
}
