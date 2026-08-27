import assert from "node:assert/strict";
import { getPublicFormPath, isPublicSlugPath, normalizePublicSlug, validatePublicSlug } from "../src/lib/publicSlug.js";

assert.equal(normalizePublicSlug(" Limited  3 "), "limited-3");
assert.deepEqual(validatePublicSlug("limited-3"), { slug: "limited-3", error: "" });
assert.equal(validatePublicSlug("limited_3").error, "영문 소문자, 숫자, 하이픈(-)만 사용할 수 있어요.");
assert.equal(validatePublicSlug("status").error, "콕폼 기본 페이지에서 사용하는 주소예요. 다른 주소를 입력해 주세요.");
assert.equal(validatePublicSlug("가나다").error, "영문 소문자, 숫자, 하이픈(-)만 사용할 수 있어요.");
assert.equal(getPublicFormPath("limited-3", "legacy-id"), "/limited-3");
assert.equal(getPublicFormPath("", "legacy-id"), "/?respond=legacy-id");
assert.equal(isPublicSlugPath("/limited-3"), "limited-3");
assert.equal(isPublicSlugPath("/docs/guide"), null);

console.log("publicSlug: all assertions passed");
