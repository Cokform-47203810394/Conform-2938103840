import { getSupabaseClient } from "./supabaseClient";

export async function signInWithGoogle() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    window.alert("설정 탭에서 Supabase 연동을 먼저 완료해주세요.");
    return;
  }
  await supabase.auth.signInWithOAuth({ provider: "google" });
}

export async function signOut() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

// Subscribes to auth state changes. Calls back with the current user (or null).
// Returns an unsubscribe function.
export function subscribeAuth(callback) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    callback(null);
    return () => {};
  }

  supabase.auth.getUser().then(({ data }) => callback(data?.user ?? null));

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => data.subscription.unsubscribe();
}
