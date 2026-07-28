import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { AdvDropdownTag } from './adv-dropdown-tag.entity';
import { AdvDropdownValue } from './adv-dropdown-value.entity';
import { AssigneeProfile } from './assignee-profile.entity';
import { UserProfile } from '../profiles/user-profile.entity';
import { ProcessTag } from './process-tag.entity';
import { QuestionTag } from './question-tag.entity';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdvDropdownTag, AdvDropdownValue, AssigneeProfile, UserProfile, ProcessTag, QuestionTag], 'user'),
    ProfilesModule,
  ],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
