import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { EmailConfigService, EmailConfigInput } from './email-config.service';
import { EmailService } from './email.service';

@Controller()
export class EmailController {
  constructor(
    private readonly emailConfigService: EmailConfigService,
    private readonly emailService: EmailService,
  ) {}

  @Get('email/config')
  getEmailConfig() {
    return this.emailConfigService.getPublicConfig();
  }

  @Put('email/config')
  updateEmailConfig(@Body() body: EmailConfigInput) {
    return this.emailConfigService.updateConfig(body);
  }

  @Put('email/config/test')
  async sendTestEmail(@Body() body: { to?: string }) {
    const to = body?.to?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }

    return this.emailService.sendEmail(
      to,
      'Hashibasha SMTP test',
      '<p>Your Email Config SMTP settings are working.</p>',
      'Your Email Config SMTP settings are working.',
    );
  }

  @Post('email/login-otp')
  async sendLoginOtpEmail(
    @Body() body: { to?: string; otp?: string; expiresInMinutes?: number },
  ) {
    const to = body?.to?.trim();
    const otp = body?.otp?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }
    if (!otp) {
      return { success: false, error: 'OTP is required' };
    }

    return this.emailService.sendLoginOtpEmail({
      to,
      otp,
      expiresInMinutes: body.expiresInMinutes,
    });
  }
}
