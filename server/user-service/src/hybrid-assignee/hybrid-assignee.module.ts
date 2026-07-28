import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HybridAssigneeController } from './hybrid-assignee.controller';
import { HybridAssigneeService } from './hybrid-assignee.service';
import { HybridAssigneeProfile } from './hybrid-assignee-profile.entity';
import { HybridAssigneeAssignment } from './hybrid-assignee-assignment.entity';
import { HybridAssigneeStore } from './hybrid-assignee-store.entity';
import { UserProfile } from '../profiles/user-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HybridAssigneeProfile,
      HybridAssigneeAssignment,
      HybridAssigneeStore,
      UserProfile,
    ], 'user'),
  ],
  controllers: [HybridAssigneeController],
  providers: [HybridAssigneeService],
  exports: [HybridAssigneeService],
})
export class HybridAssigneeModule {}
