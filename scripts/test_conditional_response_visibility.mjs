import { visibleResponseQuestions } from "../src/lib/conditionalQuestions.js";

const form = {
  questions: [
    { id: "team", type: "dropdown", title: "희망 지원 팀" },
    { id: "common", type: "long", title: "지원 동기" },
    { id: "dev", type: "long", title: "개발팀 심화", visibilityCondition: { questionId: "team", value: "개발팀" } },
    { id: "ops", type: "long", title: "관리팀 심화", visibilityCondition: { questionId: "team", value: "관리팀" } },
    { id: "marketing", type: "long", title: "마케팅팀 심화", visibilityCondition: { questionId: "team", value: "마케팅팀" } },
    { id: "research", type: "long", title: "리서칭팀 심화", visibilityCondition: { questionId: "team", value: "리서칭팀" } },
    { id: "notice", type: "privacy_notice", title: "안내" },
    { id: "section", type: "section", title: "구분" },
  ],
};

const expected = {
  개발팀: ["team", "common", "dev"],
  관리팀: ["team", "common", "ops"],
  마케팅팀: ["team", "common", "marketing"],
  리서칭팀: ["team", "common", "research"],
};

const results = Object.fromEntries(Object.entries(expected).map(([team, ids]) => {
  const actual = visibleResponseQuestions(form, { team }).map((question) => question.id);
  if (JSON.stringify(actual) !== JSON.stringify(ids)) {
    throw new Error(`${team}: expected ${ids.join(", ")}; got ${actual.join(", ")}`);
  }
  return [team, actual];
}));

console.log(JSON.stringify({ passed: true, results }, null, 2));
