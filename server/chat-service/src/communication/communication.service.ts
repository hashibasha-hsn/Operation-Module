import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { Conversation } from './conversation.entity';
import { ConversationMember } from './conversation-member.entity';
import { Message } from './message.entity';
import { SupabaseStorageService } from '../shared/supabase-storage.service';
import {
  notifyMessageReceived,
  notifyChannelInvite,
  notifyChannelMention,
} from '../shared/notification-client';

const CHAT_BUCKET = 'chat';

type Attachment = { url: string; fileName: string; mimeType: string; size: number };

@Injectable()
export class CommunicationService {
  constructor(
    @InjectRepository(Conversation, 'chat')
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(ConversationMember, 'chat')
    private memberRepository: Repository<ConversationMember>,
    @InjectRepository(Message, 'chat')
    private messageRepository: Repository<Message>,
    private storageService: SupabaseStorageService,
  ) {}

  private async resolveUsers(): Promise<any[]> {
    try {
      const url = `${process.env.USER_SERVICE_URL || 'http://localhost:3002'}/users?limit=1000`;
      const response = await fetch(url);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : data?.users ?? [];
    } catch (error) {
      console.warn('[communication] failed to fetch users', String(error));
      return [];
    }
  }

  private async userNameById(userId: string): Promise<string | null> {
    if (!userId) return null;
    const users = await this.resolveUsers();
    const match = users.find(
      (u) => String(u.userId ?? '') === userId || String(u.id ?? '') === userId,
    );
    return match?.name?.trim() || match?.email?.trim() || null;
  }

  private async assertMember(conversationId: string, userId: string): Promise<ConversationMember> {
    const member = await this.memberRepository.findOne({
      where: { conversationId, userId },
    });
    if (!member) {
      throw new ForbiddenException('You are not a member of this conversation');
    }
    if (member.status !== 'member') {
      throw new ForbiddenException('You must accept the channel invitation before participating');
    }
    return member;
  }

  async getConversationOrThrow(id: string, organizationId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({ where: { id } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return conversation;
  }

  // ---- Conversation creation ----

  async createDirectConversation(meId: string, otherUserId: string, organizationId: string) {
    if (!otherUserId || otherUserId === meId) {
      throw new BadRequestException('A direct conversation needs another user');
    }

    const existing = await this.memberRepository
      .createQueryBuilder('m1')
      .innerJoin(ConversationMember, 'm2', 'm1.conversationId = m2.conversationId')
      .where('m1.userId = :me', { me: meId })
      .andWhere('m2.userId = :other', { other: otherUserId })
      .andWhere('m1.conversationId = m2.conversationId AND m1.id != m2.id')
      .select('m1.conversationId', 'conversationId')
      .getRawOne<{ conversationId: string }>();

    if (existing) {
      return this.serializeConversation(existing.conversationId, meId);
    }

    const conversation = await this.conversationRepository.save(
      this.conversationRepository.create({
        type: 'direct',
        createdBy: meId,
        organizationId,
      }),
    );
    await this.memberRepository.save([
      this.memberRepository.create({ conversationId: conversation.id, userId: meId, role: 'owner' }),
      this.memberRepository.create({ conversationId: conversation.id, userId: otherUserId, role: 'member' }),
    ]);
    return this.serializeConversation(conversation.id, meId);
  }

  async createChannel(
    meId: string,
    organizationId: string,
    body: { name?: string; description?: string; memberUserIds?: string[] },
  ) {
    const name = (body.name ?? '').trim();
    if (!name) {
      throw new BadRequestException('Channel name is required');
    }

    const conversation = await this.conversationRepository.save(
      this.conversationRepository.create({
        type: 'channel',
        name,
        description: (body.description ?? '').trim() || null,
        createdBy: meId,
        organizationId,
      }),
    );

    const invitedUserIds = [...new Set(body.memberUserIds ?? [])].filter((id) => id !== meId);
    await this.memberRepository.save(
      this.memberRepository.create({
        conversationId: conversation.id,
        userId: meId,
        role: 'owner',
        status: 'member',
      }),
    );

    if (invitedUserIds.length) {
      await this.memberRepository.save(
        invitedUserIds.map((userId) =>
          this.memberRepository.create({
            conversationId: conversation.id,
            userId,
            role: 'member',
            status: 'invited',
          }),
        ),
      );
      const invitedByName = (await this.userNameById(meId)) || meId;
      for (const userId of invitedUserIds) {
        await notifyChannelInvite({
          userId,
          conversationId: conversation.id,
          conversationName: name,
          invitedByName,
        });
      }
    }

    return this.serializeConversation(conversation.id, meId);
  }

  // ---- Listing ----

  async listConversations(meId: string, organizationId: string) {
    const memberships = await this.memberRepository.find({
      where: { userId: meId, status: 'member' },
    });
    if (!memberships.length) return [];

    const conversationIds = memberships.map((m) => m.conversationId);
    const conversations = await this.conversationRepository.find({
      where: { id: In(conversationIds) },
      order: { updatedAt: 'DESC' },
    });

    return Promise.all(
      conversations.map((c) => this.serializeConversation(c.id, meId)),
    );
  }

  private async serializeConversation(conversationId: string, meId: string) {
    const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
    if (!conversation) return null;

    const [members, messages, myMembership] = await Promise.all([
      this.memberRepository.find({ where: { conversationId }, order: { createdAt: 'ASC' } }),
      this.messageRepository.find({
        where: { conversationId, deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
        take: 1,
      }),
      this.memberRepository.findOne({ where: { conversationId, userId: meId } }),
    ]);

    const users = await this.resolveUsers();
    const nameOf = (userId: string) => {
      const match = users.find((u) => String(u.userId ?? '') === userId || String(u.id ?? '') === userId);
      return match?.name?.trim() || match?.email?.trim() || userId;
    };

    const activeMembers = members.filter((m) => m.status === 'member');
    const memberCount = activeMembers.length;
    let otherParty: { userId: string; name: string } | null = null;
    if (conversation.type === 'direct') {
      const other = members.find((m) => m.userId !== meId);
      otherParty = other ? { userId: other.userId, name: nameOf(other.userId) } : null;
    }

    const lastReadAt = myMembership?.lastReadAt ?? null;

    let unreadCount = 0;
    if (lastReadAt) {
      unreadCount = await this.messageRepository
        .createQueryBuilder('msg')
        .where('msg.conversationId = :conversationId', { conversationId })
        .andWhere('msg.senderId != :meId', { meId })
        .andWhere('msg.deletedAt IS NULL')
        .andWhere('msg.createdAt > :lastReadAt', { lastReadAt })
        .getCount();
    }

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      description: conversation.description,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      otherParty,
      memberCount,
      myLastReadAt: lastReadAt,
      unreadCount,
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        status: m.status,
        name: nameOf(m.userId),
        notificationPreference: m.notificationPreference,
      })),
      lastMessage: messages[0]
        ? {
            id: messages[0].id,
            body: messages[0].body,
            attachment: messages[0].attachment,
            senderId: messages[0].senderId,
            senderName: nameOf(messages[0].senderId),
            createdAt: messages[0].createdAt,
          }
        : null,
    };
  }

  // ---- Membership ----

  async addMembers(conversationId: string, meId: string, userIds: string[]) {
    const conversation = await this.getConversationOrThrow(conversationId, '');
    const myMember = await this.assertMember(conversationId, meId);
    if (conversation.type !== 'channel' || (myMember.role !== 'owner' && myMember.role !== 'admin')) {
      throw new ForbiddenException('Only the channel owner or admin can add members');
    }

    const existing = await this.memberRepository.find({ where: { conversationId } });
    const existingIds = new Set(existing.map((m) => m.userId));
    const newIds = [...new Set(userIds)].filter((id) => !existingIds.has(id));

    if (newIds.length) {
      await this.memberRepository.save(
        newIds.map((userId) =>
          this.memberRepository.create({ conversationId, userId, role: 'member', status: 'invited' }),
        ),
      );
      const invitedByName = (await this.userNameById(meId)) || meId;
      const channelName = conversation.name || 'channel';
      for (const userId of newIds) {
        await notifyChannelInvite({ userId, conversationId, conversationName: channelName, invitedByName });
      }
    }

    return this.serializeConversation(conversationId, meId);
  }

  async joinChannel(conversationId: string, meId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, '');
    if (conversation.type !== 'channel') {
      throw new BadRequestException('Only channels can be joined');
    }
    const membership = await this.memberRepository.findOne({ where: { conversationId, userId: meId } });
    if (!membership) {
      throw new ForbiddenException('You were not invited to this channel');
    }
    if (membership.status !== 'invited' && membership.status !== 'declined') {
      return this.serializeConversation(conversationId, meId);
    }
    membership.status = 'member';
    await this.memberRepository.save(membership);
    return this.serializeConversation(conversationId, meId);
  }

  async declineChannelInvite(conversationId: string, meId: string) {
    const membership = await this.memberRepository.findOne({ where: { conversationId, userId: meId } });
    if (!membership) return { conversationId, declined: true };
    membership.status = 'declined';
    await this.memberRepository.save(membership);
    return { conversationId, declined: true };
  }

  async removeMember(conversationId: string, meId: string, userId: string) {
    const conversation = await this.getConversationOrThrow(conversationId, '');
    const myMember = await this.assertMember(conversationId, meId);
    if (conversation.type !== 'channel' || (myMember.role !== 'owner' && myMember.role !== 'admin')) {
      throw new ForbiddenException('Only the channel owner or admin can remove members');
    }
    if (userId === meId && myMember.role === 'owner') {
      throw new BadRequestException('The channel owner cannot remove themselves');
    }
    await this.memberRepository.delete({ conversationId, userId });
    return this.serializeConversation(conversationId, meId);
  }

  async setNotificationPreference(conversationId: string, meId: string, preference: string) {
    if (!['all', 'mentions', 'none'].includes(preference)) {
      throw new BadRequestException('Invalid notification preference');
    }
    const member = await this.assertMember(conversationId, meId);
    member.notificationPreference = preference;
    await this.memberRepository.save(member);
    return { conversationId, notificationPreference: preference };
  }

  // ---- Read status ----

  async markRead(conversationId: string, meId: string) {
    const member = await this.assertMember(conversationId, meId);
    member.lastReadAt = new Date();
    await this.memberRepository.save(member);
    return { conversationId, lastReadAt: member.lastReadAt };
  }

  // ---- Messages ----

  async sendMessage(
    conversationId: string,
    meId: string,
    body: string,
    attachment?: Attachment | null,
    parentId?: string | null,
  ) {
    const conversation = await this.getConversationOrThrow(conversationId, '');
    const myMember = await this.assertMember(conversationId, meId);

    if (parentId && conversation.type === 'channel') {
      const parent = await this.messageRepository.findOne({ where: { id: parentId, conversationId } });
      if (!parent || parent.deletedAt) throw new BadRequestException('The message you are replying to no longer exists');
    }

    const message = await this.messageRepository.save(
      this.messageRepository.create({
        conversationId,
        senderId: meId,
        body: (body ?? '').trim(),
        attachment: attachment ?? null,
        isEdited: false,
        parentId: parentId || null,
      }),
    );

    await this.memberRepository.update({ conversationId, userId: meId }, { lastReadAt: new Date() });

    const senderName = (await this.userNameById(meId)) || meId;
    const conversationName = conversation.type === 'channel' ? conversation.name || 'channel' : senderName;

    const members = await this.memberRepository.find({ where: { conversationId } });
    const mentions = this.extractMentionedUserIds(body ?? '');
    for (const member of members) {
      if (member.userId === meId) continue;
      const mentioned = mentions.has(member.userId);
      if (member.notificationPreference === 'none') continue;
      if (member.notificationPreference === 'mentions' && !mentioned) continue;

      if (mentioned) {
        await notifyChannelMention({
          userId: member.userId,
          conversationId,
          conversationName,
          senderName,
          body: (body ?? '').trim() || undefined,
        });
      } else {
        await notifyMessageReceived({
          userId: member.userId,
          conversationId,
          conversationName,
          senderName,
          body: (body ?? '').trim() || undefined,
        });
      }
    }

    return this.serializeMessage(message, senderName);
  }

  async listMessages(conversationId: string, meId: string, after?: string, limit = 50) {
    await this.assertMember(conversationId, meId);

    const qb = this.messageRepository
      .createQueryBuilder('msg')
      .where('msg.conversationId = :conversationId', { conversationId })
      .andWhere('msg.deletedAt IS NULL')
      .orderBy('msg.createdAt', 'DESC')
      .take(Math.min(Math.max(Number(limit) || 50, 1), 200));

    if (after) {
      qb.andWhere('msg.createdAt > :after', { after: new Date(after) });
    }

    const messages = await qb.getMany();
    const users = await this.resolveUsers();
    const nameOf = (userId: string) => {
      const match = users.find((u) => String(u.userId ?? '') === userId || String(u.id ?? '') === userId);
      return match?.name?.trim() || match?.email?.trim() || userId;
    };

    return Promise.all(
      messages.map(async (m) => await this.serializeMessage(m, nameOf(m.senderId))),
    ).then((rows) =>
      rows.sort(
        (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    );
  }

  async editMessage(conversationId: string, messageId: string, meId: string, body: string) {
    const message = await this.messageRepository.findOne({ where: { id: messageId, conversationId } });
    if (!message || message.deletedAt) throw new NotFoundException('Message not found');
    if (message.senderId !== meId) throw new ForbiddenException('You can only edit your own messages');
    message.body = (body ?? '').trim();
    message.isEdited = true;
    await this.messageRepository.save(message);
    return await this.serializeMessage(message, (await this.userNameById(meId)) || meId);
  }

  async deleteMessage(conversationId: string, messageId: string, meId: string) {
    const message = await this.messageRepository.findOne({ where: { id: messageId, conversationId } });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== meId) throw new ForbiddenException('You can only delete your own messages');
    message.deletedAt = new Date();
    await this.messageRepository.save(message);
    return { id: messageId, deletedAt: message.deletedAt };
  }

  private extractMentionedUserIds(body: string): Set<string> {
    const set = new Set<string>();
    const re = /@([\w-]{8,})/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(body))) {
      set.add(match[1]);
    }
    return set;
  }

  private async serializeMessage(message: Message, senderName: string) {
    let replyTo: {
      id: string;
      senderId: string;
      senderName: string;
      body: string;
      attachment: Message['attachment'];
    } | null = null;

    if (message.parentId) {
      const parent = await this.messageRepository.findOne({ where: { id: message.parentId } });
      if (parent && !parent.deletedAt) {
        replyTo = {
          id: parent.id,
          senderId: parent.senderId,
          senderName:
            (await this.userNameById(parent.senderId)) || parent.senderId,
          body: parent.body,
          attachment: parent.attachment,
        };
      }
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName,
      body: message.body,
      attachment: message.attachment,
      isEdited: message.isEdited,
      createdAt: message.createdAt,
      replyTo,
    };
  }

  // ---- Files ----

  async uploadChatFile(file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  }): Promise<Attachment> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }
    const url = await this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      CHAT_BUCKET,
    );
    if (!url) {
      throw new BadRequestException('File upload failed');
    }
    return {
      url,
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }
}
