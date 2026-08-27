import assert from "node:assert/strict";

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  },
};

const { clearResponseDraft, loadResponseDraft, saveResponseDraft } = await import("../src/lib/responseDraft.js");

const formId = "form-a";
const savedAt = saveResponseDraft(formId, { visible: "작성 중 응답", removed: "이전 질문", _cokform_email: "user@example.com" });
assert.ok(savedAt);
assert.deepEqual(loadResponseDraft(formId, ["visible"]), {
  answers: { visible: "작성 중 응답", _cokform_email: "user@example.com" },
  savedAt,
});
clearResponseDraft(formId);
assert.equal(loadResponseDraft(formId, ["visible"]), null);

const staleKey = "cokform:response-draft:v1:stale";
store.set(staleKey, JSON.stringify({ version: 1, savedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), answers: { visible: "오래된 응답" } }));
assert.equal(loadResponseDraft("stale", ["visible"]), null);
assert.equal(store.has(staleKey), false);

console.log("responseDraft: all assertions passed");
