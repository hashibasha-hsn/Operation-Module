import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserTeamsController } from './user-teams.controller';
import { UserTeamsService } from './user-teams.service';
import { UserTeam } from './user-team.entity';
import { ProfilesModule } from '../profiles/profiles.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserTeam]), ProfilesModule],
  controllers: [UserTeamsController],
  providers: [UserTeamsService],
  exports: [UserTeamsService],
})
export class UserTeamsModule {}
