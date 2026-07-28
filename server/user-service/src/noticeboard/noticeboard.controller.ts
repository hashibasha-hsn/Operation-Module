import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { NoticeboardService } from './noticeboard.service';
import { NoticeboardPost } from './noticeboard.entity';

@Controller('noticeboard')
export class NoticeboardController {
  constructor(private readonly noticeboardService: NoticeboardService) {}

  @Post()
  create(@Body() createPostDto: Partial<NoticeboardPost>) {
    return this.noticeboardService.create(createPostDto);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.noticeboardService.findAll(organizationId);
  }

  @Get('active')
  findActive(@Query('organizationId') organizationId: string) {
    return this.noticeboardService.findActive(organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noticeboardService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updatePostDto: Partial<NoticeboardPost>) {
    return this.noticeboardService.update(id, updatePostDto);
  }

  @Put(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.noticeboardService.toggleStatus(id);
  }

  @Put('reorder')
  reorderPosts(@Body() reorderDto: { organizationId: string; postOrders: { id: string; displayOrder: number }[] }) {
    return this.noticeboardService.reorderPosts(reorderDto.organizationId, reorderDto.postOrders);
  }

  @Put(':id/like')
  incrementLikes(@Param('id') id: string) {
    return this.noticeboardService.incrementLikes(id);
  }

  @Put(':id/dislike')
  incrementDislikes(@Param('id') id: string) {
    return this.noticeboardService.incrementDislikes(id);
  }

  @Put(':id/comment')
  incrementComments(@Param('id') id: string) {
    return this.noticeboardService.incrementComments(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticeboardService.remove(id);
  }
}
