type QuestionOption = {
  label: string;
  score?: number;
  isCorrect?: boolean;
};

export type CourseQuizQuestion = {
  id?: string;
  questionText: string;
  questionType: 'short-answer' | 'long-answer' | 'single-answer' | 'multiple-answers' | 'dropdown';
  options?: QuestionOption[] | { options?: QuestionOption[] };
};

function getOptionList(question: CourseQuizQuestion): QuestionOption[] {
  const raw = question.options;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray((raw as { options?: QuestionOption[] }).options)) {
    return (raw as { options: QuestionOption[] }).options;
  }
  return [];
}

function normalizeResponse(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim()) {
    if (value.startsWith('[')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        /* fall through */
      }
    }
    return [value];
  }
  return [];
}

export function scoreCourseQuiz(
  questions: CourseQuizQuestion[],
  responses: Record<string, unknown>,
): { percentage: number; score: number; maxScore: number } {
  const supported = questions.filter((q) =>
    ['short-answer', 'long-answer', 'single-answer', 'multiple-answers', 'dropdown'].includes(
      q.questionType,
    ),
  );

  if (supported.length === 0) return { percentage: 0, score: 0, maxScore: 0 };

  let earned = 0;
  let maxScore = 0;

  for (const question of supported) {
    const response = responses[question.id || question.questionText];

    if (question.questionType === 'short-answer' || question.questionType === 'long-answer') {
      const text = normalizeResponse(response)[0] ?? '';
      maxScore += 1;
      if (text.trim()) earned += 1;
      continue;
    }

    const options = getOptionList(question);
    if (options.length === 0) continue;
    maxScore += 1;

    const selected = normalizeResponse(response);
    const markedCorrect = options.filter((item) => item.isCorrect === true);

    if (question.questionType === 'single-answer' || question.questionType === 'dropdown') {
      const answer = selected[0] ?? '';
      if (!answer) continue;
      const option = options.find((item) => item.label === answer);
      if (!option) continue;
      if (option.isCorrect === true) earned += 1;
      continue;
    }

    // multiple-answers
    const selectedSet = new Set(selected);
    if (markedCorrect.length > 0) {
      const allCorrectPicked = markedCorrect.every((item) => selectedSet.has(item.label));
      const noExtraWrong = [...selectedSet].every((label) => {
        const opt = options.find((item) => item.label === label);
        return opt?.isCorrect === true;
      });
      const exactMatch = selectedSet.size === markedCorrect.length;
      if (allCorrectPicked && noExtraWrong && exactMatch) earned += 1;
      continue;
    }

    const positiveOptions = options.filter((item) => (item.score ?? 0) > 0);
    const targetOptions = positiveOptions.length ? positiveOptions : options;
    const total = targetOptions.reduce((sum, item) => sum + Math.max(0, item.score ?? 1), 0) || 1;
    const gained = [...selectedSet].reduce((sum, label) => {
      const opt = options.find((item) => item.label === label);
      return sum + Math.max(0, opt?.score ?? 0);
    }, 0);
    earned += Math.min(gained / total, 1);
  }

  const percentage = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;
  return { percentage, score: Math.round(earned * 10) / 10, maxScore };
}
