import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoticeboardPost } from './noticeboard.entity';
import { NoticeboardComment } from './noticeboard-comment.entity';
import { NoticeboardLike } from './noticeboard-like.entity';

@Injectable()
export class NoticeboardService {
  constructor(
    @InjectRepository(NoticeboardPost)
    private noticeboardRepository: Repository<NoticeboardPost>,
    @InjectRepository(NoticeboardComment)
    private commentsRepository: Repository<NoticeboardComment>,
    @InjectRepository(NoticeboardLike)
    private likesRepository: Repository<NoticeboardLike>,
  ) {}

  async create(postData: Partial<NoticeboardPost>): Promise<NoticeboardPost> {
    const maxOrder = await this.noticeboardRepository
      .createQueryBuilder('post')
      .select('MAX(post.displayOrder)', 'max')
      .where('post.organizationId = :organizationId', {
        organizationId: postData.organizationId ?? 'default-org',
      })
      .getRawOne();

    const post = this.noticeboardRepository.create({
      ...postData,
      displayOrder: (Number(maxOrder?.max) || 0) + 1,
    });
    return await this.noticeboardRepository.save(post);
  }

  async findAll(organizationId: string, activeOnly = false): Promise<NoticeboardPost[]> {
    return await this.noticeboardRepository.find({
      where: activeOnly ? { organizationId, isActive: true } : { organizationId },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<NoticeboardPost> {
    return await this.noticeboardRepository.findOne({ where: { id } });
  }

  async update(id: string, postData: Partial<NoticeboardPost>): Promise<NoticeboardPost> {
    await this.noticeboardRepository.update(id, postData);
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
  ): Promise<NoticeboardPost[]> {
    for (const { id, displayOrder } of postOrders) {
      await this.noticeboardRepository.update({ id, organizationId }, { displayOrder });
    }
    return this.findAll(organizationId, false);
  }
}
