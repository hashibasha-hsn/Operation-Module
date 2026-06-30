import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTeamsController } from './user-teams.controller';
import { UserTeamsService } from './user-teams.service';
import { UserTeam } from './user-team.entity';
import { TeamMember } from './team-member.entity';
import { UserProfile } from '../profiles/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserTeam, TeamMember, UserProfile])],
  controllers: [UserTeamsController],
  providers: [UserTeamsService],
  exports: [UserTeamsService],
})
export class UserTeamsModule {}
