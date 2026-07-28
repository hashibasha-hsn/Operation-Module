import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailConfigSettings } from './email-config.entity';
import { EmailConfigService } from './email-config.service';
import { EmailController } from './email.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EmailConfigSettings], 'notification')],
  controllers: [EmailController],
  providers: [EmailService, EmailConfigService],
  exports: [EmailService, EmailConfigService],
})
export class EmailModule {}
