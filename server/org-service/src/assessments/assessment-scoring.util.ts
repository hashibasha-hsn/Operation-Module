type QuestionOption = {
  label: string;
  score?: number;
  isCorrect?: boolean;
};

type FlatQuestion = {
  id: string;
  questionText: string;
  questionType: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
};

function getOptionList(question: FlatQuestion): QuestionOption[] {
  const raw = question.options;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as QuestionOption[];
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

function scoreSingleAnswer(question: FlatQuestion, response: unknown): { earned: number; max: number } {
  const options = getOptionList(question);
  const selected = normalizeResponse(response)[0] ?? '';
  if (!selected || options.length === 0) return { earned: 0, max: 1 };

  const option = options.find((item) => item.label === selected);
  if (!option) return { earned: 0, max: 1 };

  if (option.isCorrect === true) return { earned: 1, max: 1 };
  if (option.isCorrect === false) return { earned: 0, max: 1 };

  const scores = options.map((item) => item.score ?? 0);
  const maxScore = Math.max(...scores, 1);
  return { earned: (option.score ?? 0) / maxScore, max: 1 };
}

function scoreMultipleAnswers(question: FlatQuestion, response: unknown): { earned: number; max: number } {
  const options = getOptionList(question);
  const selected = new Set(normalizeResponse(response));
  if (options.length === 0) return { earned: 0, max: 1 };

  const markedCorrect = options.filter((item) => item.isCorrect === true);
  if (markedCorrect.length > 0) {
    const allCorrectPicked = markedCorrect.every((item) => selected.has(item.label));
    const noExtraWrong = [...selected].every((label) => {
      const opt = options.find((item) => item.label === label);
      return opt?.isCorrect === true;
    });
    const exactMatch = selected.size === markedCorrect.length;
    return {
      earned: allCorrectPicked && noExtraWrong && exactMatch ? 1 : 0,
      max: 1,
    };
  }

  const positiveOptions = options.filter((item) => (item.score ?? 0) > 0);
  const targetOptions = positiveOptions.length ? positiveOptions : options;
  const maxScore = targetOptions.reduce((sum, item) => sum + Math.max(0, item.score ?? 1), 0) || 1;
  const earnedScore = [...selected].reduce((sum, label) => {
    const opt = options.find((item) => item.label === label);
    return sum + (opt?.score ?? 0);
  }, 0);

  return { earned: Math.min(earnedScore / maxScore, 1), max: 1 };
}

function scoreShortAnswer(_question: FlatQuestion, response: unknown): { earned: number; max: number } {
  const text = normalizeResponse(response)[0] ?? '';
  return { earned: text.trim() ? 1 : 0, max: 1 };
}

export function flattenAssessmentQuestions(sections: unknown): FlatQuestion[] {
  if (!Array.isArray(sections)) return [];

  return sections.flatMap((section: any, sectionIndex: number) =>
    (section?.questions ?? []).map((question: any, questionIndex: number) => ({
      id: question.id || `section-${sectionIndex}-q-${questionIndex}`,
      questionText: question.questionText || '',
      questionType: question.questionType || '',
      options: question.options,
      isRequired: question.isRequired,
    })),
  );
}

export function scoreAssessmentAnswers(
  sections: unknown,
  responses: Record<string, unknown>,
): {
  percentage: number;
  score: number;
  passed: boolean;
  questionResults: Array<{
    id: string;
    questionText: string;
    questionType: string;
    earned: number;
    max: number;
    userAnswer: unknown;
    correctAnswer?: string | string[];
  }>;
} {
  const questions = flattenAssessmentQuestions(sections).filter((question) =>
    ['single-answer', 'multiple-answers', 'short-answer'].includes(question.questionType),
  );

  if (questions.length === 0) {
    return { percentage: 0, score: 0, passed: false, questionResults: [] };
  }

  let totalEarned = 0;
  let totalMax = 0;
  const questionResults: Array<{
    id: string;
    questionText: string;
    questionType: string;
    earned: number;
    max: number;
    userAnswer: unknown;
    correctAnswer?: string | string[];
  }> = [];

  for (const question of questions) {
    const response = responses[question.id];
    let result = { earned: 0, max: 1 };

    if (question.questionType === 'single-answer') {
      result = scoreSingleAnswer(question, response);
    } else if (question.questionType === 'multiple-answers') {
      result = scoreMultipleAnswers(question, response);
    } else if (question.questionType === 'short-answer') {
      result = scoreShortAnswer(question, response);
    }

    totalEarned += result.earned;
    totalMax += result.max;

    const options = getOptionList(question);
    let correctAnswer: string | string[] | undefined;
    if (question.questionType === 'single-answer') {
      const correct = options.find((item) => item.isCorrect === true);
      if (correct) correctAnswer = correct.label;
      else {
        const maxScore = Math.max(...options.map((item) => item.score ?? 0), -1);
        const best = options.find((item) => (item.score ?? 0) === maxScore);
        if (best) correctAnswer = best.label;
      }
    } else if (question.questionType === 'multiple-answers') {
      const marked = options.filter((item) => item.isCorrect === true);
      if (marked.length) correctAnswer = marked.map((item) => item.label);
      else {
        const positive = options.filter((item) => (item.score ?? 0) > 0);
        if (positive.length) correctAnswer = positive.map((item) => item.label);
      }
    }

    questionResults.push({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      earned: result.earned,
      max: result.max,
      userAnswer: response,
      correctAnswer,
    });
  }

  const percentage = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
  return {
    percentage,
    score: Math.round(totalEarned),
    passed: false,
    questionResults,
  };
}

export function applyPassingScore(percentage: number, passingScore: number) {
  return percentage >= (passingScore ?? 0);
}
