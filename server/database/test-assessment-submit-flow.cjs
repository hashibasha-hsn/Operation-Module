/**
 * Smoke test: assessment start → save → submit with scoring.
 * Run: node server/database/test-assessment-submit-flow.cjs
 */
const BASE = 'http://localhost:3009/api/org';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || `${options.method || 'GET'} ${path} failed (${response.status})`);
  }
  return data;
}

async function main() {
  const userId = 'admin-user-id';
  const draft = await request('/assessments/draft', {
    method: 'POST',
    body: JSON.stringify({
      title: `Submit Flow Test ${Date.now()}`,
      organizationId: 'default-org',
      passingScore: 50,
      duration: 10,
      maxAttempts: 3,
      allowRetake: true,
      showResult: true,
      showCorrectAnswer: true,
      generateCertificate: true,
      certificateSettings: {
        primaryColor: '#0284c7',
        certificateHeader: { enabled: true, text: 'Certificate of Achievement' },
        assessmentName: { enabled: true, text: 'Assessment Submit Test' },
        issuedDate: { enabled: true },
        validityType: 'duration',
        validityDuration: '1 year',
      },
      sections: [
        {
          title: 'Section 1',
          displayOrder: 0,
          questions: [
            {
              id: 'q-single-1',
              questionText: 'Pick the correct color of the sky on a clear day',
              questionType: 'single-answer',
              options: {
                options: [
                  { label: 'Blue', isCorrect: true },
                  { label: 'Green', isCorrect: false },
                ],
              },
            },
            {
              id: 'q-multi-1',
              questionText: 'Select primary colors',
              questionType: 'multiple-answers',
              options: {
                options: [
                  { label: 'Red', isCorrect: true },
                  { label: 'Blue', isCorrect: true },
                  { label: 'Yellow', isCorrect: true },
                  { label: 'Purple', isCorrect: false },
                ],
              },
            },
          ],
        },
      ],
      storeIds: [],
      assigneeIds: [],
    }),
  });

  await request(`/assessments/${draft.id}/publish`, { method: 'PUT', body: '{}' });

  const attempt = await request('/assessments/results/start', {
    method: 'POST',
    body: JSON.stringify({
      assessmentId: draft.id,
      userId,
      userEmail: 'admin@test.com',
      organizationId: 'default-org',
    }),
  });

  const responses = {
    'q-single-1': 'Blue',
    'q-multi-1': ['Red', 'Blue', 'Yellow'],
  };

  await request(`/assessments/results/${attempt.id}/save`, {
    method: 'PUT',
    body: JSON.stringify({ userId, responses }),
  });

  const submitted = await request(`/assessments/results/${attempt.id}/submit`, {
    method: 'PUT',
    body: JSON.stringify({ userId, responses }),
  });

  console.log('Assessment submit flow OK');
  console.log({
    assessmentId: draft.id,
    resultId: submitted.result.id,
    percentage: submitted.result.percentage,
    passed: submitted.result.passed,
    questionCount: submitted.questionResults.length,
  });

  if (!submitted.result.passed) {
    throw new Error('Expected passing score for correct answers');
  }
}

main().catch((error) => {
  console.error('Assessment submit flow FAILED:', error.message);
  process.exit(1);
});
