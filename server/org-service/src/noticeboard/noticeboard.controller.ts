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
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NoticeboardService } from './noticeboard.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { NoticeboardPost } from './noticeboard.entity';
import { buildNoticeboardFilename } from './noticeboard-upload.config';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('noticeboard')
export class NoticeboardController {
  private readonly logger = new Logger(NoticeboardController.name);

  constructor(
    private readonly noticeboardService: NoticeboardService,
    private readonly storageService: SupabaseStorageService,
  ) {}

  private parseOptionalDate(value: unknown): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseStringArray(value: unknown): string[] | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return [];
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        return value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }
    return [];
  }

  private async mapBodyToPost(body: Record<string, unknown>, file?: MulterFile): Promise<Partial<NoticeboardPost>> {
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

    if (body.isActive !== undefined && body.isActive !== null && body.isActive !== '') {
      postData.isActive = body.isActive === 'true' || body.isActive === true;
    }

    if ('startDate' in body) {
      postData.startDate = this.parseOptionalDate(body.startDate) ?? null;
    }
    if ('endDate' in body) {
      postData.endDate = this.parseOptionalDate(body.endDate) ?? null;
    }
    postData.targetStoreIds = [];
    postData.targetUserIds = [];

    if (file) {
      const filename = buildNoticeboardFilename(file.originalname);
      const publicUrl = await this.storageService.uploadFile(
        file.buffer,
        filename,
        file.mimetype,
      );

      if (publicUrl) {
        postData.fileUrl = publicUrl;
        postData.fileName = file.originalname;
        postData.fileType = file.mimetype;
      } else {
        this.logger.error('Failed to upload file to Supabase storage');
      }
    }

    return postData;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(@Body() body: Record<string, unknown>, @UploadedFile() file?: MulterFile) {
    return this.noticeboardService.create(await this.mapBodyToPost(body, file));
  }

  @Get()
  findAll(
    @Query('organizationId') organizationId: string,
    @Query('activeOnly') activeOnly?: string,
    @Query('userId') userId?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.noticeboardService.findAll(organizationId, activeOnly === 'true', {
      userId,
      storeId,
    });
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

  @Get(':id/reads')
  getReads(@Param('id') id: string) {
    return this.noticeboardService.getReads(id);
  }

  @Put(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Body() body: { userId: string; userName?: string },
  ) {
    return this.noticeboardService.markAsRead(id, body.userId, body.userName);
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
    const postData = await this.mapBodyToPost(body, file);
    delete postData.organizationId;
    delete postData.createdBy;
    return this.noticeboardService.update(id, postData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticeboardService.remove(id);
  }
}
