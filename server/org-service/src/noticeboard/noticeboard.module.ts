import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { NoticeboardController } from './noticeboard.controller';
import { NoticeboardService } from './noticeboard.service';
import { NoticeboardPost } from './noticeboard.entity';
import { NoticeboardComment } from './noticeboard-comment.entity';
import { NoticeboardLike } from './noticeboard-like.entity';
import { noticeboardUploadOptions } from './noticeboard-upload.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([NoticeboardPost, NoticeboardComment, NoticeboardLike]),
    MulterModule.register(noticeboardUploadOptions),
  ],
  controllers: [NoticeboardController],
  providers: [NoticeboardService],
  exports: [NoticeboardService],
})
export class NoticeboardModule {}
