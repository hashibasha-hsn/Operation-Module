import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NoticeboardPost } from './noticeboard.entity';
import { NoticeboardComment } from './noticeboard-comment.entity';
import { NoticeboardLike } from './noticeboard-like.entity';
import { NoticeboardRead } from './noticeboard-read.entity';

export type NoticeboardPostWithRead = NoticeboardPost & {
  hasRead?: boolean;
  readAt?: Date | null;
};

@Injectable()
export class NoticeboardService {
  constructor(
    @InjectRepository(NoticeboardPost, 'org')
    private noticeboardRepository: Repository<NoticeboardPost>,
    @InjectRepository(NoticeboardComment, 'org')
    private commentsRepository: Repository<NoticeboardComment>,
    @InjectRepository(NoticeboardLike, 'org')
    private likesRepository: Repository<NoticeboardLike>,
    @InjectRepository(NoticeboardRead, 'org')
    private readsRepository: Repository<NoticeboardRead>,
  ) {}

  private assertValidSchedule(startDate?: Date | null, endDate?: Date | null) {
    if (startDate && endDate && endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('End date must be on or after start date');
    }
  }

  /** Org-wide: all users see every notice (audience targeting disabled). */
  isVisibleToAudience(
    post: NoticeboardPost,
    _audience?: { userId?: string; storeId?: string },
  ): boolean {
    return true;
  }

  private async attachReadStatus(
    posts: NoticeboardPost[],
    userId?: string,
  ): Promise<NoticeboardPostWithRead[]> {
    if (!userId || posts.length === 0) {
      return posts.map((post) => ({ ...post, hasRead: false, readAt: null }));
    }

    const reads = await this.readsRepository.find({
      where: {
        userId,
        postId: In(posts.map((post) => post.id)),
      },
    });
    const readByPostId = new Map(reads.map((read) => [read.postId, read]));

    return posts.map((post) => {
      const read = readByPostId.get(post.id);
      return {
        ...post,
        hasRead: !!read,
        readAt: read?.createdAt ?? null,
      };
    });
  }

  async create(postData: Partial<NoticeboardPost>): Promise<NoticeboardPost> {
    this.assertValidSchedule(postData.startDate ?? null, postData.endDate ?? null);

    const maxOrder = await this.noticeboardRepository
      .createQueryBuilder('post')
      .select('MAX(post.displayOrder)', 'max')
      .where('post.organizationId = :organizationId', {
        organizationId: postData.organizationId ?? 'default-org',
      })
      .getRawOne();

    const post = this.noticeboardRepository.create({
      ...postData,
      isActive: postData.isActive ?? true,
      startDate: postData.startDate ?? null,
      endDate: postData.endDate ?? null,
      targetStoreIds: [],
      targetUserIds: [],
      displayOrder: (Number(maxOrder?.max) || 0) + 1,
    });
    return await this.noticeboardRepository.save(post);
  }

  async findAll(
    organizationId: string,
    activeOnly = false,
    audience?: { userId?: string; storeId?: string },
  ): Promise<NoticeboardPostWithRead[]> {
    const qb = this.noticeboardRepository
      .createQueryBuilder('post')
      .where('post.organizationId = :organizationId', { organizationId })
      .orderBy('post.displayOrder', 'ASC')
      .addOrderBy('post.createdAt', 'DESC');

    if (activeOnly) {
      const now = new Date();
      qb.andWhere('post.isActive = true')
        .andWhere('(post.startDate IS NULL OR post.startDate <= :now)', { now })
        .andWhere('(post.endDate IS NULL OR post.endDate >= :now)', { now });
    }

    let posts = await qb.getMany();
    if (activeOnly) {
      posts = posts.filter((post) => this.isVisibleToAudience(post, audience));
    }

    return this.attachReadStatus(posts, audience?.userId);
  }

  async findOne(id: string): Promise<NoticeboardPost> {
    return await this.noticeboardRepository.findOne({ where: { id } });
  }

  async update(id: string, postData: Partial<NoticeboardPost>): Promise<NoticeboardPost> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Post not found');
    }

    const nextStart =
      postData.startDate !== undefined ? postData.startDate : existing.startDate;
    const nextEnd = postData.endDate !== undefined ? postData.endDate : existing.endDate;
    this.assertValidSchedule(nextStart ?? null, nextEnd ?? null);

    const merged: Partial<NoticeboardPost> = { ...postData };
    // Notices are always org-wide; clear any legacy audience targeting on save.
    merged.targetStoreIds = [];
    merged.targetUserIds = [];

    await this.noticeboardRepository.save({
      ...existing,
      ...merged,
      id,
    });
    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.noticeboardRepository.delete(id);
  }

  async toggleStatus(id: string): Promise<NoticeboardPost> {
    const post = await this.findOne(id);
    if (post) {
      await this.noticeboardRepository.update(id, { isActive: !post.isActive });
      return await this.findOne(id);
    }
    return null;
  }

  async toggleLike(id: string, userId: string): Promise<NoticeboardPost> {
    const post = await this.findOne(id);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.likesRepository.findOne({ where: { postId: id, userId } });
    if (existing) {
      await this.likesRepository.delete(existing.id);
      await this.noticeboardRepository.update(id, {
        likesCount: Math.max(0, (post.likesCount ?? 0) - 1),
      });
    } else {
      await this.likesRepository.save(this.likesRepository.create({ postId: id, userId }));
      await this.noticeboardRepository.update(id, {
        likesCount: (post.likesCount ?? 0) + 1,
      });
    }

    return this.findOne(id);
  }

  async markAsRead(
    postId: string,
    userId: string,
    userName?: string,
  ): Promise<{ post: NoticeboardPost; read: NoticeboardRead; alreadyRead: boolean }> {
    const trimmedUserId = String(userId || '').trim();
    if (!trimmedUserId) {
      throw new BadRequestException('userId is required');
    }

    const post = await this.findOne(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.readsRepository.findOne({
      where: { postId, userId: trimmedUserId },
    });
    if (existing) {
      return { post, read: existing, alreadyRead: true };
    }

    const read = await this.readsRepository.save(
      this.readsRepository.create({
        postId,
        userId: trimmedUserId,
        userName: userName?.trim() || null,
      }),
    );

    await this.noticeboardRepository.update(postId, {
      viewsCount: (post.viewsCount ?? 0) + 1,
    });

    return {
      post: await this.findOne(postId),
      read,
      alreadyRead: false,
    };
  }

  async getReads(postId: string): Promise<NoticeboardRead[]> {
    const post = await this.findOne(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.readsRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });
  }

  async getComments(postId: string): Promise<NoticeboardComment[]> {
    return this.commentsRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
  }

  async addComment(
    postId: string,
    userId: string,
    userName: string,
    comment: string,
  ): Promise<{ post: NoticeboardPost; comments: NoticeboardComment[] }> {
    const post = await this.findOne(postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.commentsRepository.save(
      this.commentsRepository.create({
        postId,
        userId,
        userName,
        comment: comment.trim(),
      }),
    );
    await this.noticeboardRepository.update(postId, {
      commentsCount: (post.commentsCount ?? 0) + 1,
    });

    return {
      post: await this.findOne(postId),
      comments: await this.getComments(postId),
    };
  }

  async userLikedPost(postId: string, userId: string): Promise<boolean> {
    const existing = await this.likesRepository.findOne({ where: { postId, userId } });
    return !!existing;
  }

  async reorderPosts(
    organizationId: string,
    postOrders: { id: string; displayOrder: number }[],
  ): Promise<NoticeboardPostWithRead[]> {
    for (const { id, displayOrder } of postOrders) {
      await this.noticeboardRepository.update({ id, organizationId }, { displayOrder });
    }
    return this.findAll(organizationId, false);
  }
}
