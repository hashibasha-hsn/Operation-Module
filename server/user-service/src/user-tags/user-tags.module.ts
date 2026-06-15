import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTagsController } from './user-tags.controller';
import { UserTagsService } from './user-tags.service';
import { UserTag } from './user-tag.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserTag])],
  controllers: [UserTagsController],
  providers: [UserTagsService],
  exports: [UserTagsService],
})
export class UserTagsModule {}
