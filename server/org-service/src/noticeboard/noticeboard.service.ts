import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NoticeboardPost } from './noticeboard.entity';

@Injectable()
export class NoticeboardService {
  constructor(
    @InjectRepository(NoticeboardPost)
    private noticeboardRepository: Repository<NoticeboardPost>,
  ) {}

  async create(postData: Partial<NoticeboardPost>): Promise<NoticeboardPost> {
    const post = this.noticeboardRepository.create(postData);
    return await this.noticeboardRepository.save(post);
  }

  async findAll(organizationId: string): Promise<NoticeboardPost[]> {
    return await this.noticeboardRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
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

  async incrementLikes(id: string): Promise<NoticeboardPost> {
    const post = await this.findOne(id);
    if (post) {
      await this.noticeboardRepository.update(id, { likesCount: post.likesCount + 1 });
      return await this.findOne(id);
    }
    return null;
  }

  async incrementViews(id: string): Promise<NoticeboardPost> {
    const post = await this.findOne(id);
    if (post) {
      await this.noticeboardRepository.update(id, { viewsCount: post.viewsCount + 1 });
      return await this.findOne(id);
    }
    return null;
  }

  async incrementComments(id: string): Promise<NoticeboardPost> {
    const post = await this.findOne(id);
    if (post) {
      await this.noticeboardRepository.update(id, { commentsCount: post.commentsCount + 1 });
      return await this.findOne(id);
    }
    return null;
  }
}
