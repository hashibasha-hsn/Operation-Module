export const MESSAGE_RECEIVED_TYPE = 'message_received';
export const CHANNEL_MENTION_TYPE = 'channel_mention';
export const CHANNEL_INVITE_TYPE = 'channel_invite';

const NOTIFICATION_SERVICE_URL =
  process.env.NOTIFICATION_SERVICE_URL || process.env.USER_SERVICE_URL || 'http://localhost:3002';

type NotificationPayload = {
  userId: string;
  type: string;
  title: string;
  content?: string;
  data?: Record<string, unknown>;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  deliveryMethod?: 'IN_APP' | 'EMAIL' | 'PUSH' | 'SMS';
};

async function sendUserNotification(payload: NotificationPayload): Promise<void> {
  try {
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        priority: payload.priority ?? 'NORMAL',
        deliveryMethod: payload.deliveryMethod ?? 'IN_APP',
        status: 'PENDING',
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.warn('[notification-client] failed', payload.type, response.status, text);
    }
  } catch (error) {
    console.warn('[notification-client] error', payload.type, error);
  }
}

export async function notifyMessageReceived(input: {
  userId: string;
  conversationId: string;
  conversationName: string;
  senderName: string;
  body?: string;
}): Promise<void> {
  const preview = input.body ? `: ${input.body.slice(0, 120)}` : '';
  await sendUserNotification({
    userId: input.userId,
    type: MESSAGE_RECEIVED_TYPE,
    title: input.conversationName,
    content: `${input.senderName}${preview}`,
    data: {
      conversationId: input.conversationId,
      senderName: input.senderName,
      link: `/communication?conv=${input.conversationId}`,
    },
    deliveryMethod: 'IN_APP',
    priority: 'NORMAL',
  });
}

export async function notifyChannelMention(input: {
  userId: string;
  conversationId: string;
  conversationName: string;
  senderName: string;
  body?: string;
}): Promise<void> {
  await sendUserNotification({
    userId: input.userId,
    type: CHANNEL_MENTION_TYPE,
    title: `Mentioned in ${input.conversationName}`,
    content: `${input.senderName} mentioned you${input.body ? `: ${input.body.slice(0, 120)}` : ''}`,
    data: {
      conversationId: input.conversationId,
      senderName: input.senderName,
      link: `/communication?conv=${input.conversationId}`,
    },
    deliveryMethod: 'IN_APP',
    priority: 'NORMAL',
  });
}

export async function notifyChannelInvite(input: {
  userId: string;
  conversationId: string;
  conversationName: string;
  invitedByName: string;
}): Promise<void> {
  await sendUserNotification({
    userId: input.userId,
    type: CHANNEL_INVITE_TYPE,
    title: `Added to ${input.conversationName}`,
    content: `${input.invitedByName} added you to the channel "${input.conversationName}".`,
    data: {
      conversationId: input.conversationId,
      invitedByName: input.invitedByName,
      link: `/communication?conv=${input.conversationId}`,
    },
    deliveryMethod: 'IN_APP',
    priority: 'NORMAL',
  });
}
