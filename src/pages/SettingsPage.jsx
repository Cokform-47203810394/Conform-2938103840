import { useEffect, useState } from "react";
import { Cloud, CloudOff, LogIn, LogOut } from "lucide-react";
import { ELEV1, MD } from "../theme";
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  hasSupabaseConfig,
} from "../lib/supabaseClient";
import { signInWithGoogle, signOut, subscribeAuth } from "../lib/auth";

export default function SettingsPage() {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const cfg = getSupabaseConfig();
    setUrl(cfg.url);
    setKey(cfg.key);
    setConnected(hasSupabaseConfig());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuth(setUser);
    return unsubscribe;
  }, [connected]);

  const handleSave = () => {
    saveSupabaseConfig(url.trim(), key.trim());
    setConnected(Boolean(url.trim() && key.trim()));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl("");
    setKey("");
    setConnected(false);
    setUser(null);
  };

  return (
    <div className="space-y-4">
      {/* data storage */}
      <div className={`rounded-xl bg-white p-5 ${ELEV1}`}>
        <div className="mb-1 flex items-center gap-2">
          {connected ? <Cloud size={18} style={{ color: MD.primary }} /> : <CloudOff size={18} className="text-[#78837C]" />}
          <h2 className="text-base font-medium text-[#17251F]">데이터 저장소</h2>
        </div>
        <p className="mb-4 text-sm text-[#59645E]">
          {connected
            ? "Supabase에 연결되어 있어요. 폼과 응답이 클라우드에 저장됩니다."
            : "아직 연동 전이에요. 지금은 이 브라우저의 로컬 저장소에만 저장됩니다."}
        </p>

        <div className="space-y-3">
          <label className="block text-sm text-[#59645E]">
            Supabase Project URL
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="mt-1 w-full rounded-md border border-[#C9CEC6] bg-white px-3 py-2 text-base outline-none focus:border-[#17866D] sm:text-sm"
            />
          </label>
          <label className="block text-sm text-[#59645E]">
            Supabase Anon Key
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOi..."
              type="password"
              className="mt-1 w-full rounded-md border border-[#C9CEC6] bg-white px-3 py-2 text-base outline-none focus:border-[#17866D] sm:text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="rounded-full px-5 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: MD.primary }}
            >
              {saved ? "저장됨 ✓" : "저장"}
            </button>
            {connected && (
              <button
                onClick={handleClear}
                className="rounded-full border border-[#C9CEC6] px-5 py-2 text-sm font-medium text-[#59645E]"
              >
                연동 해제
              </button>
            )}
          </div>
        </div>
      </div>

      {/* account */}
      <div className={`rounded-xl bg-white p-5 ${ELEV1}`}>
        <h2 className="mb-1 text-base font-medium text-[#17251F]">계정</h2>
        <p className="mb-4 text-sm text-[#59645E]">
          Supabase 연동 후, Supabase 대시보드의 Authentication → Providers에서 Google을 켜면 아래 버튼으로 로그인할
          수 있어요.
        </p>
        {user ? (
          <div className="flex items-center justify-between rounded-lg bg-[#F5F3EC] px-4 py-3">
            <div className="text-sm text-[#17251F]">{user.email}</div>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-sm font-medium text-[#B3261E] hover:underline"
            >
              <LogOut size={14} /> 로그아웃
            </button>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 rounded-full border border-[#C9CEC6] px-5 py-2 text-sm font-medium text-[#17251F] hover:bg-[#17251F]/[0.04]"
          >
            <LogIn size={15} /> Google로 로그인
          </button>
        )}
      </div>

      <div className="rounded-xl border-2 border-dashed border-[#C9CEC6] p-5 text-xs leading-relaxed text-[#78837C]">
        Supabase 프로젝트가 없다면 supabase.com에서 무료로 만들 수 있어요. 테이블 생성 SQL과 자세한 순서는 프로젝트
        루트의 README.md를 참고하세요.
      </div>
    </div>
  );
}
