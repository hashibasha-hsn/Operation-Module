import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeboardService } from './noticeboard.service';
import { NoticeboardController } from './noticeboard.controller';
import { NoticeboardPost } from './noticeboard.entity';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [TypeOrmModule.forFeature([NoticeboardPost]), ProfilesModule],
  controllers: [NoticeboardController],
  providers: [NoticeboardService],
  exports: [NoticeboardService],
})
export class NoticeboardModule {}
