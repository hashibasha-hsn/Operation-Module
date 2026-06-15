import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionPointsService } from './action-points.service';
import { ActionPointsController } from './action-points.controller';
import { ActionPoint } from './action-point.entity';
import { SubmissionsModule } from '../submissions/submissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([ActionPoint]), SubmissionsModule],
  controllers: [ActionPointsController],
  providers: [ActionPointsService],
  exports: [ActionPointsService],
})
export class ActionPointsModule {}
