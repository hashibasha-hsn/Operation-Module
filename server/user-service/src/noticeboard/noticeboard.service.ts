import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoticeboardPost } from './noticeboard.entity';

@Injectable()
export class NoticeboardService {
  constructor(
    @InjectRepository(NoticeboardPost, 'user')
    private noticeboardRepository: Repository<NoticeboardPost>,
  ) {}

  async create(postData: Partial<NoticeboardPost>): Promise<NoticeboardPost> {
    const maxOrder = await this.noticeboardRepository
      .createQueryBuilder('post')
      .select('MAX(post.displayOrder)', 'max')
      .where('post.organizationId = :organizationId', { organizationId: postData.organizationId })
      .getRawOne();
    
    const displayOrder = (maxOrder?.max || 0) + 1;
    
    const post = this.noticeboardRepository.create({
      ...postData,
      displayOrder,
    });
    return await this.noticeboardRepository.save(post);
  }

  async findAll(organizationId: string): Promise<NoticeboardPost[]> {
    return await this.noticeboardRepository.find({
      where: { organizationId },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async findActive(organizationId: string): Promise<NoticeboardPost[]> {
    return await this.noticeboardRepository.find({
      where: { organizationId, isActive: true },
      order: { displayOrder: 'ASC', createdAt: 'DESC' },
      relations: ['creator'],
    });
  }

  async findOne(id: string): Promise<NoticeboardPost> {
    return await this.noticeboardRepository.findOne({
      where: { id },
      relations: ['creator'],
    });
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
    if (!post) throw new Error('Post not found');
    
    return await this.update(id, { isActive: !post.isActive });
  }

  async reorderPosts(organizationId: string, postOrders: { id: string; displayOrder: number }[]): Promise<void> {
    for (const { id, displayOrder } of postOrders) {
      await this.noticeboardRepository.update(id, { displayOrder });
    }
  }

  async incrementLikes(id: string): Promise<NoticeboardPost> {
    const post = await this.findOne(id);
    if (!post) throw new Error('Post not found');
    
    return await this.update(id, { likesCount: post.likesCount + 1 });
  }

  async incrementDislikes(id: string): Promise<NoticeboardPost> {
    const post = await this.findOne(id);
    if (!post) throw new Error('Post not found');
    
    return await this.update(id, { dislikesCount: post.dislikesCount + 1 });
  }

  async incrementComments(id: string): Promise<NoticeboardPost> {
    const post = await this.findOne(id);
    if (!post) throw new Error('Post not found');
    
    return await this.update(id, { commentsCount: post.commentsCount + 1 });
  }
}
