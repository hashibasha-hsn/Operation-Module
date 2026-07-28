import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessesService } from './processes.service';
import { ProcessesController } from './processes.controller';
import { Process } from './process.entity';
import { ProcessSection } from './process-section.entity';
import { ProcessQuestion } from './process-question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Process, ProcessSection, ProcessQuestion], 'org')],
  controllers: [ProcessesController],
  providers: [ProcessesService],
  exports: [ProcessesService],
})
export class ProcessesModule {}
