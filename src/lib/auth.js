import { getSupabaseClient } from "./supabaseClient";

export async function signInWithGoogle() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    window.alert("서비스 연결이 아직 준비되지 않았어요.");
    return;
  }
  const redirectTo = new URL(import.meta.env.BASE_URL || "/", window.location.origin).toString();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
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
