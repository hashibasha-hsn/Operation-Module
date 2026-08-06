import { getCurrentUserId, getOrganizationId } from "@/lib/authStorage";

const CHAT_API = import.meta.env.VITE_CHAT_API || "/api/chat";

export interface ChatAttachment {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface ChatMember {
  userId: string;
  role: "owner" | "admin" | "member";
  status: "member" | "invited" | "declined";
  name: string;
  notificationPreference: "all" | "mentions" | "none";
}

export interface ChatConversation {
  id: string;
  type: "direct" | "channel";
  name: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  otherParty: { userId: string; name: string } | null;
  memberCount: number;
  myLastReadAt: string | null;
  unreadCount: number;
  members: ChatMember[];
  lastMessage: {
    id: string;
    body: string;
    attachment: ChatAttachment | null;
    senderId: string;
    senderName: string;
    createdAt: string;
  } | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  attachment: ChatAttachment | null;
  isEdited: boolean;
  createdAt: string;
  replyTo: {
    id: string;
    senderId: string;
    senderName: string;
    body: string;
    attachment: ChatAttachment | null;
  } | null;
}

function currentUser() {
  return getCurrentUserId();
}

async function handle<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data as T;
}

export async function fetchConversations(organizationId = getOrganizationId()): Promise<ChatConversation[]> {
  try {
    const params = new URLSearchParams({ meId: currentUser(), organizationId });
    const response = await fetch(`${CHAT_API}/communication/conversations?${params}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function createDirectConversation(
  otherUserId: string,
  organizationId = getOrganizationId(),
): Promise<ChatConversation> {
  const response = await fetch(`${CHAT_API}/communication/conversations/direct`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meId: currentUser(), otherUserId, organizationId }),
  });
  return handle<ChatConversation>(response);
}

export async function createChannel(
  name: string,
  description: string,
  memberUserIds: string[],
  organizationId = getOrganizationId(),
): Promise<ChatConversation> {
  const response = await fetch(`${CHAT_API}/communication/conversations/channel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meId: currentUser(), organizationId, name, description, memberUserIds }),
  });
  return handle<ChatConversation>(response);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await fetch(`${CHAT_API}/communication/conversations/${conversationId}/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meId: currentUser() }),
  });
}

export async function joinChannel(conversationId: string): Promise<ChatConversation> {
  const response = await fetch(`${CHAT_API}/communication/conversations/${conversationId}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meId: currentUser() }),
  });
  return handle<ChatConversation>(response);
}

export async function declineChannel(conversationId: string): Promise<void> {
  await fetch(`${CHAT_API}/communication/conversations/${conversationId}/decline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meId: currentUser() }),
  });
}

export async function addChannelMembers(conversationId: string, userIds: string[]): Promise<ChatConversation> {
  const response = await fetch(`${CHAT_API}/communication/conversations/${conversationId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meId: currentUser(), userIds }),
  });
  return handle<ChatConversation>(response);
}

export async function removeChannelMember(conversationId: string, userId: string): Promise<ChatConversation> {
  const params = new URLSearchParams({ meId: currentUser() });
  const response = await fetch(
    `${CHAT_API}/communication/conversations/${conversationId}/members/${encodeURIComponent(userId)}?${params}`,
    { method: "DELETE" },
  );
  return handle<ChatConversation>(response);
}

export async function setNotificationPreference(
  conversationId: string,
  preference: "all" | "mentions" | "none",
): Promise<void> {
  await fetch(`${CHAT_API}/communication/conversations/${conversationId}/notification`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meId: currentUser(), preference }),
  });
}

export async function fetchMessages(
  conversationId: string,
  after?: string,
  limit = 100,
): Promise<ChatMessage[]> {
  const params = new URLSearchParams({ meId: currentUser(), limit: String(limit) });
  if (after) params.set("after", after);
  const response = await fetch(`${CHAT_API}/communication/conversations/${conversationId}/messages?${params}`);
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export async function sendMessage(
  conversationId: string,
  body: string,
  attachment?: ChatAttachment | null,
  parentId?: string | null,
): Promise<ChatMessage> {
  const response = await fetch(`${CHAT_API}/communication/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      meId: currentUser(),
      body,
      attachment: attachment ?? null,
      parentId: parentId ?? null,
    }),
  });
  return handle<ChatMessage>(response);
}

export async function editMessage(
  conversationId: string,
  messageId: string,
  body: string,
): Promise<ChatMessage> {
  const response = await fetch(
    `${CHAT_API}/communication/conversations/${conversationId}/messages/${messageId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meId: currentUser(), body }),
    },
  );
  return handle<ChatMessage>(response);
}

export async function deleteMessage(conversationId: string, messageId: string): Promise<void> {
  const params = new URLSearchParams({ meId: currentUser() });
  await fetch(
    `${CHAT_API}/communication/conversations/${conversationId}/messages/${messageId}?${params}`,
    { method: "DELETE" },
  );
}

export async function uploadChatFile(file: File): Promise<ChatAttachment> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${CHAT_API}/communication/upload`, {
    method: "POST",
    body: form,
  });
  return handle<ChatAttachment>(response);
}
