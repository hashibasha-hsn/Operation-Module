import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NoticeboardService } from './noticeboard.service';
import { NoticeboardPost } from './noticeboard.entity';
import { buildNoticeboardFileUrl } from './noticeboard-upload.config';

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

  private mapBodyToPost(body: Record<string, unknown>, file?: MulterFile): Partial<NoticeboardPost> {
    const postData: Partial<NoticeboardPost> = {
      title: String(body.title ?? ''),
      description: String(body.description ?? ''),
      adminOnlyComments: body.adminOnlyComments === 'true' || body.adminOnlyComments === true,
      tagNames: body.tagNames
        ? typeof body.tagNames === 'string'
          ? JSON.parse(body.tagNames)
          : (body.tagNames as string[])
        : [],
      organizationId: String(body.organizationId ?? 'default-org'),
      createdBy: String(body.createdBy ?? 'system'),
    };

    if (file) {
      postData.fileUrl = buildNoticeboardFileUrl(file.filename);
      postData.fileName = file.originalname;
      postData.fileType = file.mimetype;
    }

    return postData;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Body() body: Record<string, unknown>, @UploadedFile() file?: MulterFile) {
    return this.noticeboardService.create(this.mapBodyToPost(body, file));
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.noticeboardService.findAll(organizationId, activeOnly === 'true');
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.noticeboardService.getComments(id);
  }

  @Post(':id/comments')
  addComment(
    @Param('id') id: string,
    @Body() body: { userId: string; userName?: string; comment: string },
  ) {
    return this.noticeboardService.addComment(
      id,
      body.userId,
      body.userName ?? 'User',
      body.comment,
    );
  }

  @Put(':id/like')
  toggleLike(@Param('id') id: string, @Body() body: { userId: string }) {
    return this.noticeboardService.toggleLike(id, body.userId);
  }

  @Put('reorder')
  reorderPosts(
    @Body() body: { organizationId: string; postOrders: { id: string; displayOrder: number }[] },
  ) {
    return this.noticeboardService.reorderPosts(
      body.organizationId || 'default-org',
      body.postOrders ?? [],
    );
  }

  @Put(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.noticeboardService.toggleStatus(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noticeboardService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @UploadedFile() file?: MulterFile,
  ) {
    const postData = this.mapBodyToPost(body, file);
    delete postData.organizationId;
    delete postData.createdBy;
    return this.noticeboardService.update(id, postData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticeboardService.remove(id);
  }
}
