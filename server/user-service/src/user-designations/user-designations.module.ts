import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDesignationsService } from './user-designations.service';
import { UserDesignationsController } from './user-designations.controller';
import { UserDesignation } from './user-designation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserDesignation])],
  controllers: [UserDesignationsController],
  providers: [UserDesignationsService],
  exports: [UserDesignationsService],
})
export class UserDesignationsModule {}
