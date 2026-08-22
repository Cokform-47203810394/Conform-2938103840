import fs from "node:fs";

const formId = "7ae20cd6-fdf1-44a5-863c-56a380ca9169";
const projectId = "bnbdxcyarerrmijuvxdb";
const spec = JSON.parse(fs.readFileSync("tmp_rofolder_team_questions.json", "utf8"));

const items = spec.teams.flatMap((team) => {
  const visibilityCondition = { questionId: spec.sourceQuestionId, value: team.name };
  const section = {
    id: team.sectionId,
    type: "section",
    title: team.sectionTitle,
    description: team.sectionDescription,
    descriptionFormat: "plain",
    required: false,
    visibilityCondition,
  };
  const questions = team.questions.map(([id, type, title, required, options]) => ({
    id,
    type,
    title,
    required,
    ...(options ? { options } : {}),
    visibilityCondition,
  }));
  return [section, ...questions];
});

const json = JSON.stringify(items).replace(/'/g, "''");
const query = `
WITH additions AS (
  SELECT '${json}'::jsonb AS items
),
private_update AS (
  UPDATE public.forms AS f
  SET data = jsonb_set(
        f.data,
        '{form,questions}',
        COALESCE(f.data #> '{form,questions}', '[]'::jsonb) || (SELECT items FROM additions),
        true
      ),
      updated_at = NOW()
  WHERE f.id = '${formId}'
  RETURNING f.id
)
UPDATE public.form_public AS p
SET data = jsonb_set(
      p.data,
      '{questions}',
      COALESCE(p.data -> 'questions', '[]'::jsonb) || (SELECT items FROM additions),
      true
    ),
    updated_at = NOW()
WHERE p.id = '${formId}'
  AND EXISTS (SELECT 1 FROM private_update)
RETURNING p.id, jsonb_array_length(p.data -> 'questions') AS total_questions;
`;

const payload = { project_id: projectId, query };
fs.writeFileSync("/home/ubuntu/Cokform-Conform-2938103840/tmp_rofolder_question_update_input.json", JSON.stringify(payload));
console.log(JSON.stringify({ formId, additions: items.length, output: "tmp_rofolder_question_update_input.json" }));
