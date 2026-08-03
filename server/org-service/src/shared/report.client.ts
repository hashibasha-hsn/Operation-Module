import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3016';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || '';

export type ReportQuestion = {
  questionText: string;
  questionType?: string;
  answer?: unknown;
};

export type ReportSection = {
  title: string;
  questions: ReportQuestion[];
};

export type SubmissionReportPayload = {
  processTitle: string;
  workflowType?: string;
  submittedBy?: string;
  storeName?: string;
  submittedAt?: string;
  status?: string;
  sections: ReportSection[];
};

type ReportRecipientsConfig = {
  submitter?: boolean;
  storeManager?: boolean;
  custom?: boolean;
  hierarchical?: boolean;
  storeHierarchical?: boolean;
  customUserIds?: string[];
  customDesignationIds?: string[];
};

async function resolveUserEmail(userId: string): Promise<string | null> {
  if (!userId) return null;
  if (userId.includes('@')) return userId;
  try {
    const response = await axios.get(
      `${USER_SERVICE_URL}/users/${encodeURIComponent(userId)}`,
      { timeout: 3000 },
    );
    const email = response.data?.email?.trim();
    if (email) return email;
  } catch (error) {
    console.warn('[report-client] failed to resolve user email', userId, String(error));
  }
  // user-service keyed by `userId`, but clients may store the profile `id`.
  // Resolve against the full list as a fallback so either identifier works.
  const users = await fetchAllUsers();
  const match = users.find(
    (u) =>
      u.id === userId ||
      u.userId === userId ||
      String(u.email ?? '').toLowerCase() === String(userId).toLowerCase(),
  );
  const email = match?.email?.trim();
  if (!email) console.warn('[report-client] no email for user', userId);
  return email || null;
}

async function fetchAllUsers(): Promise<any[]> {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users?limit=1000`, { timeout: 5000 });
    const data = response.data;
    return Array.isArray(data) ? data : data?.users ?? [];
  } catch (error) {
    console.warn('[report-client] failed to fetch users', error);
    return [];
  }
}

async function fetchDesignations(): Promise<any[]> {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/designations?organizationId=default-org`, {
      timeout: 5000,
    });
    const data = response.data;
    return Array.isArray(data) ? data : data?.designations ?? [];
  } catch (error) {
    console.warn('[report-client] failed to fetch designations', error);
    return [];
  }
}

async function resolveStoreManager(storeId: string): Promise<string | null> {
  if (!storeId) return null;
  const users = await fetchAllUsers();
  const candidates = users.filter((u) => {
    const matchesStore =
      u.storeId === storeId ||
      u.entityId === storeId ||
      String(u.storeName ?? '').toLowerCase() === String(storeId).toLowerCase();
    const looksManager = /manager|store_?manager|supervisor/i.test(
      [u.designation, u.role, u.systemRoleName].filter(Boolean).join(' '),
    );
    return matchesStore && looksManager;
  });
  const manager = candidates[0];
  if (!manager) return null;
  return manager.email || (await resolveUserEmail(manager.userId ?? manager.id));
}

async function resolveDesignationMembers(designationIds: string[]): Promise<string[]> {
  if (!designationIds?.length) return [];
  const designations = await fetchDesignations();
  const names = new Set(
    designationIds
      .map((id) => designations.find((d) => d.id === id)?.name)
      .filter(Boolean),
  );
  if (names.size === 0) return [];
  const users = await fetchAllUsers();
  const emails: string[] = [];
  for (const user of users) {
    if (names.has(user.designation)) {
      const email = user.email || (await resolveUserEmail(user.userId ?? user.id));
      if (email) emails.push(email);
    }
  }
  return [...new Set(emails)];
}

async function resolveHierarchyManagers(submitterUserId: string, storeId: string): Promise<string[]> {
  const users = await fetchAllUsers();
  const byUserId = new Map(users.map((u) => [u.userId ?? u.id, u]));
  const emails: string[] = [];
  const seen = new Set<string>();
  let current = byUserId.get(submitterUserId);
  let hops = 0;
  while (current && hops < 10) {
    const managerRef = current.manager;
    if (!managerRef || seen.has(managerRef)) break;
    seen.add(managerRef);
    const manager = byUserId.get(managerRef) ?? users.find((u) => u.email === managerRef);
    if (!manager) break;
    const email = manager.email || (await resolveUserEmail(manager.userId ?? manager.id));
    if (email && !emails.includes(email)) emails.push(email);
    current = manager;
    hops += 1;
  }
  return emails;
}

export async function emailSubmissionReport(input: {
  submission: any;
  process: any;
  config: ReportRecipientsConfig;
  workflowType?: string;
}): Promise<void> {
  try {
    const { submission, process, config, workflowType } = input;
    const processTitle = process?.title ?? submission.workflowId ?? 'Submission';
    const recipients: string[] = [];
    const names: string[] = [];

    if (config?.submitter) {
      const email = await resolveUserEmail(submission.submittedBy);
      if (email && !recipients.includes(email)) recipients.push(email);
    }

    if (config?.storeManager) {
      const email = await resolveStoreManager(submission.storeId);
      if (email && !recipients.includes(email)) recipients.push(email);
    }

    if (config?.custom && config.customUserIds?.length) {
      for (const userId of config.customUserIds) {
        const email = await resolveUserEmail(userId);
        if (email && !recipients.includes(email)) recipients.push(email);
      }
    }

    if (config?.custom && config.customDesignationIds?.length) {
      const designationEmails = await resolveDesignationMembers(config.customDesignationIds);
      for (const email of designationEmails) {
        if (email && !recipients.includes(email)) recipients.push(email);
      }
    }

    if (config?.hierarchical || config?.storeHierarchical) {
      const hierarchyEmails = await resolveHierarchyManagers(submission.submittedBy, submission.storeId);
      for (const email of hierarchyEmails) {
        if (email && !recipients.includes(email)) recipients.push(email);
      }
    }

    if (recipients.length === 0) {
      console.warn('[report-client] skipping submission report: no recipients resolved');
      return;
    }

    const report = buildReportPayload({
      process,
      submission,
      processTitle,
      workflowType,
    });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (INTERNAL_SERVICE_TOKEN) {
      headers['x-service-token'] = INTERNAL_SERVICE_TOKEN;
    }

    await axios.post(
      `${EMAIL_SERVICE_URL}/email/submission-report`,
      {
        to: recipients,
        names,
        processTitle,
        submissionId: submission.id,
        report,
      },
      { headers, timeout: 15000 },
    );
  } catch (error: any) {
    console.warn(
      '[report-client] failed to send submission report email',
      input?.submission?.id,
      error?.response?.status || error?.message || error,
    );
  }
}

function buildReportPayload(input: {
  process: any;
  submission: any;
  processTitle: string;
  workflowType?: string;
}): SubmissionReportPayload {
  const sections: ReportSection[] = [];
  const answers = input.submission?.answers?.responses ?? {};
  const sectionsRaw = input.process?.sections ?? [];

  for (const section of sectionsRaw) {
    const questions: ReportQuestion[] = [];
    for (const question of section?.questions ?? []) {
      questions.push({
        questionText: question.questionText ?? 'Question',
        questionType: question.questionType,
        answer: answers[question.id],
      });
    }
    sections.push({ title: section?.title ?? 'Section', questions });
  }

  return {
    processTitle: input.processTitle,
    workflowType: input.workflowType ?? input.submission?.workflowType,
    submittedBy: input.submission?.submittedBy,
    storeName: input.submission?.storeId,
    submittedAt: input.submission?.submittedAt
      ? new Date(input.submission.submittedAt).toISOString()
      : undefined,
    status: input.submission?.status,
    sections,
  };
}
