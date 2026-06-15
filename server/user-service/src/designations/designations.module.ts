import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignationsService } from './designations.service';
import { DesignationsController } from './designations.controller';
import { Designation } from './designation.entity';
import { DesignationRoleMappingModule } from '../designation-role-mapping/designation-role-mapping.module';

@Module({
  imports: [TypeOrmModule.forFeature([Designation]), DesignationRoleMappingModule],
  controllers: [DesignationsController],
  providers: [DesignationsService],
  exports: [DesignationsService],
})
export class DesignationsModule {}
