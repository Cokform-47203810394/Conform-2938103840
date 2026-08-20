import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { sanitizeRichText } from "../lib/sanitizeRichText";

const COMMANDS = [
  { cmd: "bold", icon: Bold, label: "굵게" },
  { cmd: "italic", icon: Italic, label: "기울임" },
  { cmd: "underline", icon: Underline, label: "밑줄" },
  { cmd: "strikeThrough", icon: Strikethrough, label: "취소선" },
];

// Lightweight rich-text field: contentEditable + document.execCommand for the four
// formats Google Forms exposes. Deliberately not a full editor library — this is the
// smallest thing that gives bold/italic/underline/strikethrough without a dependency.
export default function RichTextInput({ value, onChange, placeholder, className = "", editorId }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  const lastValue = useRef(value);

  useEffect(() => {
    // only push external value changes in (e.g. switching questions) — never while the
    // user is actively typing, or the cursor would jump to the start on every keystroke
    if (ref.current && value !== lastValue.current && document.activeElement !== ref.current) {
      ref.current.innerHTML = sanitizeRichText(value);
      lastValue.current = value;
    }
  }, [value]);

  const commit = () => {
    const html = sanitizeRichText(ref.current?.innerHTML || "");
    lastValue.current = html;
    onChange(html);
  };

  const applyFormat = (cmd) => {
    ref.current?.focus();
    document.execCommand(cmd);
    commit();
  };

  return (
    <div className={`relative ${className}`}>
      {focused && (
        <div className="absolute -top-10 left-0 z-20 flex items-center gap-0.5 rounded-lg bg-[#17251F] p-1 shadow-lg">
          {COMMANDS.map(({ cmd, icon: Icon, label }) => (
            <button
              key={cmd}
              type="button"
              title={label}
              // mousedown (not click) so this fires before the field's onBlur steals focus
              onMouseDown={(e) => {
                e.preventDefault();
                applyFormat(cmd);
              }}
              className="flex h-7 w-7 items-center justify-center rounded text-white hover:bg-white/20"
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      )}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          commit();
        }}
        onInput={commit}
        data-placeholder={placeholder}
        data-cokform-editor={editorId}
        className="outline-none empty:before:text-[#78837C] empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  );
}
