import { getSupabaseClient } from "./supabaseClient";

export const GOOGLE_PROVIDER_TOKEN_KEY = "cokform:google:provider-token";

export async function signInWithGoogle({ scopes, prompt } = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    window.alert("서비스 연결이 아직 준비되지 않았어요.");
    return;
  }
  // Always return to the canonical production origin after OAuth. Using
  // window.location.origin here sends preview/local builds to temporary hosts
  // such as localhost, which can be rejected or become confusing in pilot use.
  const redirectTo = import.meta.env.DEV
    ? new URL(import.meta.env.BASE_URL || "/", window.location.origin).toString()
    : "https://cokform.pages.dev/";
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      ...(scopes ? { scopes } : {}),
      ...(prompt ? { queryParams: { prompt } } : {}),
    },
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

  supabase.auth.getSession().then(({ data }) => {
    if (data?.session?.provider_token) sessionStorage.setItem(GOOGLE_PROVIDER_TOKEN_KEY, data.session.provider_token);
    callback(data?.session?.user ?? null);
  });

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.provider_token) sessionStorage.setItem(GOOGLE_PROVIDER_TOKEN_KEY, session.provider_token);
    callback(session?.user ?? null);
  });

  return () => data.subscription.unsubscribe();
}
