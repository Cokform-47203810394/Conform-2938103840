import { useEffect, useRef, useState } from "react";

const SCRIPT_ID = "cokform-turnstile-script";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
// A Turnstile site key is public by design. The paired secret stays only in
// Supabase Vault and is verified by the server-side submission gateway.
const TURNSTILE_SITE_KEY = "0x4AAAAAAET_-GA5VPoNOy37";

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    const onLoad = () => window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile_unavailable"));
    const onError = () => reject(new Error("turnstile_load_failed"));
    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });
}

/**
 * A managed Turnstile check is required only before the encrypted payload leaves
 * the respondent's browser. The widget sees no answer content or private form key.
 */
export default function TurnstileChallenge({ onToken, resetSignal = 0 }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [retrySignal, setRetrySignal] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "light",
          size: "flexible",
          callback: (token) => {
            onToken(token);
            setStatus("ready");
          },
          "expired-callback": () => {
            onToken("");
            setStatus("expired");
          },
          "error-callback": (errorCode) => {
            // No form data is sent to this callback. Keep a diagnostic code only
            // in the console, while offering a clear recovery action in the UI.
            console.warn("Turnstile verification error", errorCode);
            onToken("");
            setStatus("error");
          },
        });
      })
      .catch(() => setStatus("error"));

    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [onToken, retrySignal]);

  useEffect(() => {
    if (resetSignal && widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onToken("");
      setStatus("loading");
    }
  }, [resetSignal, onToken]);

  const retryVerification = () => {
    onToken("");
    setStatus("loading");
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      return;
    }
    setRetrySignal((value) => value + 1);
  };

  return (
    <div className="rounded-xl border border-[#DDE1D9] bg-white px-4 py-3" aria-live="polite">
      <div ref={containerRef} />
      {status === "loading" && <p className="mt-2 text-xs text-[#59645E]">안전한 응답 제출을 확인하는 중입니다.</p>}
      {status === "expired" && <p className="mt-2 text-xs text-[#B3261E]">보안 확인 시간이 만료되었습니다. 다시 확인해 주세요.</p>}
      {status === "error" && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs leading-5 text-[#B3261E]">
          <p>보안 확인에 실패했어요. 네트워크 차단 설정을 확인한 뒤 다시 시도해 주세요.</p>
          <button type="button" onClick={retryVerification} className="rounded-full border border-[#E7A29D] bg-white px-2.5 py-1 text-xs font-semibold text-[#8C1D18] hover:bg-[#FDEBE9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B3261E]/30">보안 확인 다시 시도</button>
        </div>
      )}
    </div>
  );
}
