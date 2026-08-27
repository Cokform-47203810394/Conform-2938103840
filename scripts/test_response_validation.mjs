import assert from "node:assert/strict";
import { findBlacklistViolation, normalizeBlacklistWords } from "../src/lib/responseValidation.js";

const words = normalizeBlacklistWords("광고\n스팸,광고\n  사칭  ");
assert.deepEqual(words, ["광고", "스팸", "사칭"]);

const paragraph = { id: "motivation", type: "paragraph" };
const choice = { id: "team", type: "radio" };
const baseSettings = { blacklistWords: ["스팸", "광고 링크"], blacklistScope: "all" };

assert.equal(findBlacklistViolation("무료 스팸 링크입니다", paragraph, baseSettings), "스팸");
assert.equal(findBlacklistViolation("광고 링크 포함", paragraph, baseSettings), "광고 링크");
assert.equal(findBlacklistViolation("정상 지원 내용", paragraph, baseSettings), null);
assert.equal(findBlacklistViolation("스팸", choice, { ...baseSettings, blacklistScope: "text" }), null);
assert.equal(findBlacklistViolation("스팸", paragraph, { ...baseSettings, blacklistScope: "selected", blacklistQuestionIds: ["other"] }), null);
assert.equal(findBlacklistViolation("스팸", paragraph, { ...baseSettings, blacklistScope: "selected", blacklistQuestionIds: ["motivation"] }), "스팸");

console.log("responseValidation: all assertions passed");
