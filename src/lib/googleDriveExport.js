import { GOOGLE_PROVIDER_TOKEN_KEY, signInWithGoogle } from "./auth";
import { getSupabaseClient } from "./supabaseClient";

// Non-sensitive, per-file permission: Cokform can only create files it owns or
// files that the user explicitly selects for it. It never receives Drive-wide access.
export const GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink";

export async function requestGoogleDriveAccess(returnFormId) {
  if (returnFormId) sessionStorage.setItem("cokform:workspace:return-form", returnFormId);
  return signInWithGoogle({ scopes: GOOGLE_DRIVE_FILE_SCOPE, prompt: "consent" });
}

export async function getGoogleDriveAccessToken() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.provider_token || sessionStorage.getItem(GOOGLE_PROVIDER_TOKEN_KEY) || null;
}

export async function uploadGoogleDriveFile(accessToken, { blob, name, mimeType, convertToMimeType }) {
  if (!accessToken) throw new Error("drive_access_required");
  const boundary = `cokform_${crypto.randomUUID().replaceAll("-", "")}`;
  const metadata = { name, ...(convertToMimeType ? { mimeType: convertToMimeType } : {}) };
  const body = new Blob([
    `--${boundary}\r\n`,
    "Content-Type: application/json; charset=UTF-8\r\n\r\n",
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\n`,
    `Content-Type: ${mimeType}\r\n\r\n`,
    blob,
    `\r\n--${boundary}--`,
  ]);

  const response = await fetch(DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!response.ok) {
    const rawBody = await response.text();
    let detail = {};
    try {
      detail = JSON.parse(rawBody)?.error || {};
    } catch {
      detail = {};
    }
    const error = new Error(detail.message || `drive_upload_${response.status}`);
    error.status = response.status;
    error.reason = detail.errors?.[0]?.reason || detail.status || "";
    throw error;
  }
  return response.json();
}
