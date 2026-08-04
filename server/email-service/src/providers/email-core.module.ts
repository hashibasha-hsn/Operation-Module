import { Module } from '@nestjs/common';
import { EmailService } from '../email.service';
import { GraphEmailProvider } from './graph.provider';
import { SmtpEmailProvider } from './smtp.provider';
import { EmailConfigModule } from '../email-config/email-config.module';

@Module({
  imports: [EmailConfigModule],
  providers: [EmailService, GraphEmailProvider, SmtpEmailProvider],
  exports: [EmailService],
})
export class EmailCoreModule {}
