import { createClient } from "@supabase/supabase-js";

const CONFIG_KEY = "form-builder:supabase-config";

function readStoredConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getSupabaseConfig() {
  const stored = readStoredConfig();
  return {
    url: stored?.url || import.meta.env.VITE_SUPABASE_URL || "",
    key: stored?.key || import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  };
}

export function hasSupabaseConfig() {
  const { url, key } = getSupabaseConfig();
  return Boolean(url && key);
}

export function saveSupabaseConfig(url, key) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify({ url, key }));
}

export function clearSupabaseConfig() {
  localStorage.removeItem(CONFIG_KEY);
}

// Returns a fresh client each call so it always reflects the latest saved config.
// Returns null when no config is set — callers should fall back to local storage.
export function getSupabaseClient() {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}
