import { useEffect, useState } from "react";
import { Cloud, CloudOff, LogIn, LogOut } from "lucide-react";
import { ELEV1, MD } from "../theme";
import { hasSupabaseConfig } from "../lib/supabaseClient";
import { signInWithGoogle, signOut, subscribeAuth } from "../lib/auth";

export default function SettingsPage() {
  const [connected, setConnected] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setConnected(hasSupabaseConfig());
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuth(setUser);
    return unsubscribe;
  }, [connected]);

  return (
    <div className="space-y-4">
      <div className={`rounded-xl bg-white p-5 ${ELEV1}`}>
        <div className="mb-1 flex items-center gap-2">
          {connected ? <Cloud size={18} style={{ color: MD.primary }} /> : <CloudOff size={18} className="text-[#78837C]" />}
          <h2 className="text-base font-medium text-[#17251F]">서비스 상태</h2>
        </div>
        <p className="text-sm leading-6 text-[#59645E]">
          {connected
            ? "서비스 연결이 준비되어 있어요. 응답 데이터는 브라우저에서 암호화된 뒤 저장됩니다."
            : "아직 서비스 연결이 준비되지 않았어요. 운영자가 배포 환경에서 Supabase를 설정하면 사용할 수 있습니다."}
        </p>
      </div>

      <div className={`rounded-xl bg-white p-5 ${ELEV1}`}>
        <h2 className="mb-1 text-base font-medium text-[#17251F]">계정</h2>
        <p className="mb-4 text-sm leading-6 text-[#59645E]">
          Google 계정으로 폼 소유자를 확인합니다. 로그인 설정은 운영자가 관리하며, 이 화면에서는 저장소 주소나 키를 입력하지 않습니다.
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
            disabled={!connected}
            className="flex items-center gap-2 rounded-full border border-[#C9CEC6] px-5 py-2 text-sm font-medium text-[#17251F] hover:bg-[#17251F]/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn size={15} /> Google로 로그인
          </button>
        )}
      </div>

      <div className="rounded-xl border-2 border-dashed border-[#C9CEC6] p-5 text-xs leading-relaxed text-[#78837C]">
        저장소 설정은 사용자 브라우저에 노출하지 않습니다. 배포 환경의 Supabase 설정과 RLS 정책을 기준으로 연결됩니다.
      </div>
    </div>
  );
}
