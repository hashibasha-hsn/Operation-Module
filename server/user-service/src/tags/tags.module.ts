import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { AdvDropdownTag } from './adv-dropdown-tag.entity';
import { AdvDropdownValue } from './adv-dropdown-value.entity';
import { AssigneeProfile } from './assignee-profile.entity';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdvDropdownTag, AdvDropdownValue, AssigneeProfile]),
    ProfilesModule,
  ],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
