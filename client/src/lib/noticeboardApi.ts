import { getOrganizationId } from '@/lib/authStorage';
import { formatDateTime } from '@/lib/formatDateTime';

export const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE || 'http://localhost:3009';
export const ORG_API = import.meta.env.VITE_ORG_API || 'http://localhost:3009/api/org';
export const NOTICEboard_API = `${ORG_API}/noticeboard`;

export type NoticeboardPost = {
  id: string;
  title: string;
  description: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  targetStoreIds?: string[];
  targetUserIds?: string[];
  likesCount?: number;
  viewsCount?: number;
  commentsCount?: number;
  displayOrder?: number;
  tagNames?: string[];
  adminOnlyComments?: boolean;
  organizationId?: string;
  hasRead?: boolean;
  readAt?: string | null;
};

export type NoticeboardRead = {
  id: string;
  postId: string;
  userId: string;
  userName?: string | null;
  createdAt: string;
};

export type NoticeboardScheduleStatus = 'always' | 'scheduled' | 'live' | 'expired';

export function toNoticeboardDatetimeLocal(value?: string | Date | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatNoticeboardSchedule(value?: string | Date | null): string {
  return formatDateTime(value);
}

export function getNoticeboardScheduleStatus(post: {
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  isActive?: boolean;
}): NoticeboardScheduleStatus {
  const now = Date.now();
  const start = post.startDate ? new Date(post.startDate).getTime() : null;
  const end = post.endDate ? new Date(post.endDate).getTime() : null;

  if (end !== null && !Number.isNaN(end) && end < now) return 'expired';
  if (start !== null && !Number.isNaN(start) && start > now) return 'scheduled';
  if (!post.startDate && !post.endDate) return 'always';
  return 'live';
}

export type NoticeboardComment = {
  id: string;
  postId: string;
  userId: string;
  userName?: string;
  comment: string;
  createdAt: string;
};

export function getNoticeboardMediaUrl(fileUrl?: string | null): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
  if (fileUrl.startsWith('/')) return `${MEDIA_BASE}${fileUrl}`;
  return `${MEDIA_BASE}/uploads/noticeboard/${fileUrl}`;
}

export function isNoticeboardVideo(fileType?: string | null): boolean {
  return !!fileType?.startsWith('video/');
}

export function isNoticeboardImage(fileType?: string | null): boolean {
  return !!fileType?.startsWith('image/');
}

export function getNoticeboardTargetSummary(post: {
  targetStoreIds?: string[] | null;
  targetUserIds?: string[] | null;
}): string {
  const stores = Array.isArray(post.targetStoreIds) ? post.targetStoreIds.length : 0;
  const users = Array.isArray(post.targetUserIds) ? post.targetUserIds.length : 0;
  if (stores === 0 && users === 0) return 'Everyone';
  const parts: string[] = [];
  if (stores > 0) parts.push(`${stores} store${stores === 1 ? '' : 's'}`);
  if (users > 0) parts.push(`${users} user${users === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

export async function fetchNoticeboardPosts(
  organizationId = getOrganizationId(),
  activeOnly = true,
  audience?: { userId?: string; storeId?: string },
): Promise<NoticeboardPost[]> {
  const params = new URLSearchParams({ organizationId });
  if (activeOnly) params.set('activeOnly', 'true');
  if (audience?.userId) params.set('userId', audience.userId);
  if (audience?.storeId) params.set('storeId', audience.storeId);
  const response = await fetch(`${NOTICEboard_API}?${params}`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function createNoticeboardPost(formData: FormData): Promise<NoticeboardPost | null> {
  const response = await fetch(NOTICEboard_API, { method: 'POST', body: formData });
  if (!response.ok) return null;
  return response.json();
}

export async function updateNoticeboardPost(id: string, formData: FormData): Promise<NoticeboardPost | null> {
  const response = await fetch(`${NOTICEboard_API}/${id}`, { method: 'PUT', body: formData });
  if (!response.ok) return null;
  return response.json();
}

export async function toggleNoticeboardLike(
  postId: string,
  userId: string,
): Promise<NoticeboardPost | null> {
  const response = await fetch(`${NOTICEboard_API}/${postId}/like`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) return null;
  return response.json();
}

export async function markNoticeboardPostRead(
  postId: string,
  payload: { userId: string; userName?: string },
): Promise<{ post: NoticeboardPost; read: NoticeboardRead; alreadyRead: boolean } | null> {
  const response = await fetch(`${NOTICEboard_API}/${postId}/read`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return null;
  return response.json();
}

export async function fetchNoticeboardReads(postId: string): Promise<NoticeboardRead[]> {
  const response = await fetch(`${NOTICEboard_API}/${postId}/reads`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchNoticeboardComments(postId: string): Promise<NoticeboardComment[]> {
  const response = await fetch(`${NOTICEboard_API}/${postId}/comments`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function addNoticeboardComment(
  postId: string,
  payload: { userId: string; userName?: string; comment: string },
): Promise<{ post: NoticeboardPost; comments: NoticeboardComment[] } | null> {
  const response = await fetch(`${NOTICEboard_API}/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) return null;
  return response.json();
}

export async function toggleNoticeboardPostStatus(id: string): Promise<NoticeboardPost | null> {
  const response = await fetch(`${NOTICEboard_API}/${id}/toggle-status`, { method: 'PUT' });
  if (!response.ok) return null;
  return response.json();
}

export async function deleteNoticeboardPost(id: string): Promise<boolean> {
  const response = await fetch(`${NOTICEboard_API}/${id}`, { method: 'DELETE' });
  return response.ok;
}

export async function reorderNoticeboardPosts(
  postOrders: { id: string; displayOrder: number }[],
  organizationId = getOrganizationId(),
): Promise<NoticeboardPost[]> {
  const response = await fetch(`${NOTICEboard_API}/reorder`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, postOrders }),
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function downloadNoticeboardPost(post: NoticeboardPost) {
  const mediaUrl = getNoticeboardMediaUrl(post.fileUrl);
  if (mediaUrl) {
    const response = await fetch(mediaUrl);
    if (!response.ok) throw new Error('Could not download media');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = post.fileName || `noticeboard-${post.id}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  }

  const blob = new Blob([`${post.title}\n\n${post.description}`], { type: 'text/plain;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${post.title || 'noticeboard-post'}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
