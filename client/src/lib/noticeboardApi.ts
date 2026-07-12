import { MEDIA_BASE, ORG_API } from './apiConfig';
export { MEDIA_BASE, ORG_API };
export const NOTICEboard_API = `${ORG_API}/noticeboard`;

export type NoticeboardPost = {
  id: string;
  title: string;
  description: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  isActive?: boolean;
  likesCount?: number;
  viewsCount?: number;
  commentsCount?: number;
  displayOrder?: number;
  tagNames?: string[];
  adminOnlyComments?: boolean;
  organizationId?: string;
};

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

export async function fetchNoticeboardPosts(
  organizationId = 'default-org',
  activeOnly = true,
): Promise<NoticeboardPost[]> {
  const params = new URLSearchParams({ organizationId });
  if (activeOnly) params.set('activeOnly', 'true');
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

export async function deleteNoticeboardPost(id: string): Promise<boolean> {
  const response = await fetch(`${NOTICEboard_API}/${id}`, { method: 'DELETE' });
  return response.ok;
}

export async function reorderNoticeboardPosts(
  postOrders: { id: string; displayOrder: number }[],
  organizationId = 'default-org',
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
