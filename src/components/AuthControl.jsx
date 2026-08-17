import { LogIn, LogOut, UserCircle2 } from "lucide-react";
import { signInWithGoogle, signOut } from "../lib/auth";

export default function AuthControl({ user, compact = false, showLogout = true }) {
  if (user) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <div className={`${compact ? "h-9 w-9 justify-center px-0" : "px-3"} flex min-w-0 items-center gap-1.5 rounded-full border border-[#C9CEC6] bg-[#FFFDF8] py-2 text-xs font-medium text-[#17251F]`} title={user.email || "Google 계정"}>
          <UserCircle2 size={16} className="shrink-0 text-[#17866D]" />
          <span className={compact ? "sr-only" : "hidden max-w-[13rem] truncate sm:inline"}>{user.email || "Google 계정"}</span>
        </div>
        {showLogout && (
          <button
            type="button"
            onClick={signOut}
            title="로그아웃"
            className={`${compact ? "h-9 w-9" : "gap-1.5 px-3"} flex shrink-0 items-center justify-center rounded-full border border-[#C9CEC6] bg-[#FFFDF8] text-xs font-semibold text-[#59645E] transition hover:border-[#17866D] hover:bg-[#D8F5E8] hover:text-[#0B4D3D]`}
          >
            <LogOut size={15} />
            {!compact && <span className="hidden sm:inline">로그아웃</span>}
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={signInWithGoogle}
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#17866D] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#0F705B] sm:px-4 sm:text-sm"
    >
      <LogIn size={15} />
      <span>Google 로그인</span>
    </button>
  );
}
