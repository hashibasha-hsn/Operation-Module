import { getOrganizationId } from '@/lib/authStorage';
const ORG_API = import.meta.env.VITE_ORG_API || '/api/org';

export {
  getCurrentUser,
  getCurrentUserId,
  getCurrentUserDisplayName,
} from './processSubmission';

export { fetchEntitiesForUser } from './processSubmission';

export async function fetchAssessmentById(id: string) {
  const response = await fetch(`${ORG_API}/assessments/${id}`);
  if (!response.ok) throw new Error('Assessment not found');
  return response.json();
}

export async function fetchUserAssessmentResults(userId: string) {
  const response = await fetch(
    `${ORG_API}/assessments/results/user/${userId}?organizationId=${encodeURIComponent(getOrganizationId())}`,
  );
  if (!response.ok) return [];
  return response.json();
}

export async function startAssessmentAttempt(payload: {
  assessmentId: string;
  userId: string;
  userEmail?: string;
  storeId?: string;
}) {
  const response = await fetch(`${ORG_API}/assessments/results/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, organizationId: getOrganizationId() }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Could not start assessment');
  }
  return data;
}

export async function saveAssessmentAttemptDraft(
  resultId: string,
  userId: string,
  responses: Record<string, unknown>,
) {
  const response = await fetch(`${ORG_API}/assessments/results/${resultId}/save`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, responses }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to save draft');
  }
  return data;
}

export type AssessmentSubmitResponse = {
  result: {
    id: string;
    percentage: number;
    score: number;
    passed: boolean;
    status: string;
    completedAt?: string;
  };
  assessment: {
    id: string;
    title: string;
    passingScore: number;
    showResult?: boolean;
    showCorrectAnswer?: boolean;
    generateCertificate?: boolean;
    certificateSettings?: Record<string, unknown>;
  };
  questionResults: Array<{
    id: string;
    questionText: string;
    questionType: string;
    earned: number;
    max: number;
    userAnswer: unknown;
    correctAnswer?: string | string[];
  }>;
};

export async function submitAssessmentAttempt(
  resultId: string,
  userId: string,
  responses: Record<string, unknown>,
): Promise<AssessmentSubmitResponse> {
  const response = await fetch(`${ORG_API}/assessments/results/${resultId}/submit`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, responses }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to submit assessment');
  }
  return data;
}

export async function discardAssessmentAttempt(resultId: string, userId: string) {
  const response = await fetch(
    `${ORG_API}/assessments/results/${resultId}/discard?userId=${encodeURIComponent(userId)}`,
    { method: 'DELETE' },
  );
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Failed to discard attempt');
  }
}

export function flattenAssessmentQuestions(assessment: any) {
  return (assessment?.questions ?? []).flatMap((section: any, sectionIndex: number) =>
    (section?.questions ?? []).map((question: any, questionIndex: number) => ({
      ...question,
      id: question.id || `section-${sectionIndex}-q-${questionIndex}`,
      sectionTitle: section.title,
    })),
  );
}

export function getLatestResultForAssessment(results: any[], assessmentId: string) {
  return results.find((item) => item.assessmentId === assessmentId);
}

export function getInProgressResult(results: any[], assessmentId: string) {
  return results.find(
    (item) => item.assessmentId === assessmentId && item.status === 'in_progress',
  );
}

export function countCompletedAttempts(results: any[], assessmentId: string) {
  return results.filter(
    (item) => item.assessmentId === assessmentId && item.status === 'completed',
  ).length;
}
