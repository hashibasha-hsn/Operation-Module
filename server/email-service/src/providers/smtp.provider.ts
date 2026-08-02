import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailProvider, SendMailInput, SendMailResult } from './email-provider.interface';
import { ResolvedEmailConfig } from '../email-config/email-config.service';

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  name = 'smtp' as const;
  private readonly logger = new Logger(SmtpEmailProvider.name);

  async send(
    config: ResolvedEmailConfig,
    input: SendMailInput,
  ): Promise<SendMailResult> {
    const { smtp } = config;
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth.user ? { user: smtp.auth.user, pass: smtp.auth.pass } : undefined,
    });

    const recipients = Array.isArray(input.to) ? input.to.join(', ') : input.to;

    try {
      const info = await transporter.sendMail({
        from: smtp.from,
        to: recipients,
        cc: input.cc?.join(', '),
        replyTo: input.replyTo,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      this.logger.error(`SMTP send failed: ${error?.message}`);
      return { success: false, error: error?.message || 'SMTP send failed' };
    }
  }
}
