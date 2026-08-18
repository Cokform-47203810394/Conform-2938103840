import { useEffect, useRef, useState } from "react";

const SCRIPT_ID = "cokform-turnstile-script";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

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
  const [siteKey, setSiteKey] = useState("");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/submission-config", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("submission_config_unavailable");
        const data = await response.json();
        if (typeof data?.turnstileSiteKey !== "string" || !data.turnstileSiteKey) throw new Error("missing_turnstile_site_key");
        return data.turnstileSiteKey;
      })
      .then((key) => {
        if (!cancelled) setSiteKey(key);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return undefined;
    let cancelled = false;
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
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
          "error-callback": () => {
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
  }, [siteKey, onToken]);

  useEffect(() => {
    if (resetSignal && widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onToken("");
      setStatus("loading");
    }
  }, [resetSignal, onToken]);

  return (
    <div className="rounded-xl border border-[#DDE1D9] bg-white px-4 py-3" aria-live="polite">
      <div ref={containerRef} />
      {status === "loading" && <p className="mt-2 text-xs text-[#59645E]">안전한 응답 제출을 확인하는 중입니다.</p>}
      {status === "expired" && <p className="mt-2 text-xs text-[#B3261E]">보안 확인 시간이 만료되었습니다. 다시 확인해 주세요.</p>}
      {status === "error" && <p className="mt-2 text-xs text-[#B3261E]">보안 확인을 불러오지 못했습니다. 네트워크 차단 설정을 확인한 뒤 다시 시도해 주세요.</p>}
    </div>
  );
}
