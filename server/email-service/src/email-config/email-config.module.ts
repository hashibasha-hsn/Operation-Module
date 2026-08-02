import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailConfigSettings } from './email-config.entity';
import { EmailConfigService } from './email-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfigSettings])],
  providers: [EmailConfigService],
  exports: [EmailConfigService],
})
export class EmailConfigModule {}
