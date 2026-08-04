import { getOrganizationId } from '@/lib/authStorage';

const ORG_API = import.meta.env.VITE_ORG_API || '/api/org';

export async function uploadSubmissionFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${ORG_API}/submissions/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Failed to upload file');
  }
  return data?.url ?? null;
}

export function fileNameFromUrl(url: string): string {
  try {
    const clean = url.split('?')[0];
    const parts = clean.split('/');
    const last = parts[parts.length - 1] ?? '';
    const match = last.match(/^\d+-(\d+-)?(.+)$/);
    return match ? match[2] : last;
  } catch {
    return url;
  }
}

export function isFileUploadType(questionType: string | undefined): boolean {
  return (
    questionType === 'file-upload' ||
    questionType === 'file' ||
    questionType === 'photo' ||
    questionType === 'attachment'
  );
}

export function isUrlValue(value: unknown): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}
