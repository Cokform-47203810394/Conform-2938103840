export function isQuestionVisibleForAnswers(question, answers = {}) {
  const condition = question?.visibilityCondition;
  if (!condition?.questionId) return true;

  const sourceValue = answers?.[condition.questionId];
  return Array.isArray(sourceValue)
    ? sourceValue.includes(condition.value)
    : sourceValue === condition.value;
}

export function isResponseQuestion(question) {
  return question?.type !== "privacy_notice" && question?.type !== "section";
}

export function visibleResponseQuestions(form, answers = {}) {
  return (form?.questions || []).filter(
    (question) => isResponseQuestion(question) && isQuestionVisibleForAnswers(question, answers),
  );
}
