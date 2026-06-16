import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NoticeboardService } from './noticeboard.service';
import { NoticeboardPost } from './noticeboard.entity';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

@Controller('noticeboard')
export class NoticeboardController {
  constructor(private readonly noticeboardService: NoticeboardService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() body: any,
    @UploadedFile() file: MulterFile,
  ) {
    const postData: Partial<NoticeboardPost> = {
      title: body.title,
      description: body.description,
      adminOnlyComments: body.adminOnlyComments === 'true',
      tagNames: body.tagNames ? JSON.parse(body.tagNames) : [],
      organizationId: body.organizationId,
      createdBy: body.createdBy || 'system',
    };

    if (file) {
      postData.fileUrl = file.path;
      postData.fileName = file.originalname;
      postData.fileType = file.mimetype;
    }

    return this.noticeboardService.create(postData);
  }

  @Get()
  findAll(@Query('organizationId') organizationId: string) {
    return this.noticeboardService.findAll(organizationId);
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

  @Put(':id/like')
  like(@Param('id') id: string) {
    return this.noticeboardService.incrementLikes(id);
  }

  @Put(':id/view')
  view(@Param('id') id: string) {
    return this.noticeboardService.incrementViews(id);
  }

  @Put(':id/comment')
  comment(@Param('id') id: string) {
    return this.noticeboardService.incrementComments(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticeboardService.remove(id);
  }
}
