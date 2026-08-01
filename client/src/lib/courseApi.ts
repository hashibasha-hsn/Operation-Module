import { getStoredUser, getOrganizationId } from '@/lib/authStorage';

const ORG_API = import.meta.env.VITE_ORG_API || '/api/org';

function getOrgId(): string {
  const user = getStoredUser();
  return getOrganizationId();
}

function getUserId(): string {
  const user = getStoredUser();
  return (user.userId ?? user.id ?? '') as string;
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'message' in data
        ? String((data as { message: string | string[] }).message)
        : `Request failed (${response.status})`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
  return data as T;
}

export interface CoursePayload {
  title: string;
  description?: string;
  categoryId?: string;
  content?: Record<string, unknown>;
  status?: 'draft' | 'published' | 'archived';
  assigneeIds?: string[];
  storeIds?: string[];
  assigneeProfiles?: Record<string, unknown>;
  publishedAt?: string | null;
  expiresAt?: string | null;
  isActive?: boolean;
  generateCertificate?: boolean;
  organizationId?: string;
  createdBy?: string;
}

export interface CourseResponse {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  content: Record<string, unknown> | null;
  status: string;
  assigneeIds: string[] | null;
  storeIds: string[] | null;
  assigneeProfiles: Record<string, unknown> | null;
  publishedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  generateCertificate: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

export interface CategoryResponse {
  id: string;
  categoryName: string;
  description: string | null;
  isActive: boolean;
  organizationId: string;
}

export async function createCourse(payload: CoursePayload): Promise<CourseResponse> {
  const response = await fetch(`${ORG_API}/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      organizationId: payload.organizationId || getOrgId(),
      createdBy: payload.createdBy || getUserId(),
    }),
  });
  return parseJson<CourseResponse>(response);
}

export async function updateCourse(id: string, payload: Partial<CoursePayload>): Promise<CourseResponse> {
  const response = await fetch(`${ORG_API}/courses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson<CourseResponse>(response);
}

export async function fetchCourses(): Promise<CourseResponse[]> {
  const response = await fetch(`${ORG_API}/courses?organizationId=${getOrgId()}`);
  return parseJson<CourseResponse[]>(response);
}

export async function fetchCourse(id: string): Promise<CourseResponse> {
  const response = await fetch(`${ORG_API}/courses/${id}`);
  return parseJson<CourseResponse>(response);
}

export async function deleteCourse(id: string): Promise<void> {
  const userId = getUserId();
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
  const response = await fetch(`${ORG_API}/courses/${id}${query}`, { method: 'DELETE' });
  await parseJson(response);
}

export async function fetchCategories(): Promise<CategoryResponse[]> {
  const response = await fetch(`${ORG_API}/courses/categories?organizationId=${getOrgId()}`);
  return parseJson<CategoryResponse[]>(response);
}

export async function createCategory(payload: {
  categoryName: string;
  description?: string;
}): Promise<CategoryResponse> {
  const response = await fetch(`${ORG_API}/courses/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      organizationId: getOrgId(),
      createdBy: getUserId(),
    }),
  });
  return parseJson<CategoryResponse>(response);
}

export async function updateCategory(
  id: string,
  payload: { categoryName?: string; description?: string; isActive?: boolean },
): Promise<CategoryResponse> {
  const response = await fetch(`${ORG_API}/courses/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson<CategoryResponse>(response);
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${ORG_API}/courses/categories/${id}`, { method: 'DELETE' });
  await parseJson(response);
}

export async function fetchQuizzes(): Promise<any[]> {
  const response = await fetch(`${ORG_API}/courses/quizzes?organizationId=${getOrgId()}`);
  return parseJson<any[]>(response);
}

export async function createQuiz(payload: {
  quizTitle: string;
  description?: string;
  duration?: number;
  passingScore?: number;
  questions?: unknown[];
}): Promise<any> {
  const response = await fetch(`${ORG_API}/courses/quizzes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      organizationId: getOrgId(),
      createdBy: getUserId(),
    }),
  });
  return parseJson(response);
}

export async function assignCourse(
  id: string,
  body: { assigneeIds?: string[]; storeIds?: string[]; assigneeProfiles?: Record<string, unknown> },
): Promise<CourseResponse> {
  const response = await fetch(`${ORG_API}/courses/${id}/assignment`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseJson<CourseResponse>(response);
}

export interface AssignedCourse {
  id: string;
  courseId: string;
  course: CourseResponse;
  status: string;
  progress: number;
  quizScore: unknown;
  startedAt: string | null;
  completedAt: string | null;
}

export async function fetchAssignedCourses(userId: string): Promise<AssignedCourse[]> {
  const response = await fetch(
    `${ORG_API}/courses/progress/user/${encodeURIComponent(userId)}?organizationId=${encodeURIComponent(getOrgId())}`,
  );
  const data = await parseJson<any[]>(response);
  return (Array.isArray(data) ? data : [])
    .filter((row) => row?.course)
    .map((row) => ({
      id: row.id,
      courseId: row.courseId,
      course: row.course,
      status: row.status,
      progress: Number(row.progress ?? 0),
      quizScore: row.quizScore ?? null,
      startedAt: row.startedAt ?? null,
      completedAt: row.completedAt ?? null,
    }));
}

export async function updateCourseProgress(
  progressId: string,
  data: {
    status?: string;
    progress?: number;
    startedAt?: string | null;
    completedAt?: string | null;
    quizScore?: unknown;
  },
): Promise<any> {
  const response = await fetch(`${ORG_API}/courses/progress/${encodeURIComponent(progressId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return parseJson(response);
}

export async function updateQuiz(id: string, payload: Record<string, unknown>): Promise<any> {
  const response = await fetch(`${ORG_API}/courses/quizzes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(response);
}

export async function deleteQuiz(id: string): Promise<void> {
  const response = await fetch(`${ORG_API}/courses/quizzes/${id}`, { method: 'DELETE' });
  await parseJson(response);
}

export async function uploadCourseFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${ORG_API}/courses/content/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await parseJson<{ url: string | null }>(response);
  return data?.url ?? null;
}

export async function submitCourseQuiz(
  progressId: string,
  answers: Record<string, unknown>,
  lessonsComplete = false,
): Promise<{ progress: any; percentage: number; passed: boolean }> {
  const response = await fetch(`${ORG_API}/courses/progress/${encodeURIComponent(progressId)}/quiz-submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, lessonsComplete }),
  });
  return parseJson(response);
}

export interface CourseCertificateRecord {
  id: string;
  courseId: string;
  course: CourseResponse | null;
  score: number;
  issuedAt: string | null;
  expiresAt: string | null;
  settings: Record<string, unknown> | null;
  createdAt: string;
}

export async function fetchUserCertificates(userId: string): Promise<CourseCertificateRecord[]> {
  const response = await fetch(
    `${ORG_API}/courses/certificates/user/${encodeURIComponent(userId)}?organizationId=${encodeURIComponent(getOrgId())}`,
  );
  const data = await parseJson<any[]>(response);
  return (Array.isArray(data) ? data : []).map((row) => ({
    id: row.id,
    courseId: row.courseId,
    course: row.course ?? null,
    score: Number(row.score ?? 0),
    issuedAt: row.issuedAt ?? null,
    expiresAt: row.expiresAt ?? null,
    settings: row.settings ?? null,
    createdAt: row.createdAt ?? null,
  }));
}

export async function fetchStores(): Promise<{ id: string; name: string }[]> {
  const response = await fetch(`${ORG_API}/entities`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.map((e: any) => ({ id: e.id, name: e.storeName || e.entityId || e.id }));
}

export async function fetchProfiles(): Promise<{ id: string; name: string }[]> {
  const USER_API = import.meta.env.VITE_USER_API || '/api/user';
  const response = await fetch(
    `${USER_API}/hybrid-assignee-profiles/dashboard?organizationId=${encodeURIComponent(getOrgId())}`,
  );
  if (!response.ok) return [];
  const data = await response.json();
  return (data.profiles || []).map((p: any) => ({ id: p.id, name: p.name }));
}
