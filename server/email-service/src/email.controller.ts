import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { EmailConfigService, EmailConfigInput } from './email-config/email-config.service';
import { EmailService } from './email.service';
import { AdminGuard } from './guards/admin.guard';

@Controller('email')
export class EmailController {
  constructor(
    private readonly emailConfigService: EmailConfigService,
    private readonly emailService: EmailService,
  ) {}

  @Get('config')
  getConfig() {
    return this.emailConfigService.getConfig();
  }

  @UseGuards(AdminGuard)
  @Put('config')
  updateConfig(@Body() body: EmailConfigInput) {
    return this.emailConfigService.updateConfig(body);
  }

  @UseGuards(AdminGuard)
  @Put('config/test')
  async sendTestEmail(@Body() body: { to?: string }) {
    const to = body?.to?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }

    return this.emailService.send({
      to,
      subject: 'Hashibasha email test',
      html: '<p>Your email configuration is working.</p>',
      text: 'Your email configuration is working.',
    });
  }

  @Post('activation')
  sendAccountActivation(@Body() body: { to?: string; name?: string; password?: string; token?: string }) {
    const to = body?.to?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }
    if (!body?.token?.trim()) {
      return { success: false, error: 'Activation token is required' };
    }
    return this.emailService.sendAccountActivation({
      to,
      name: body.name,
      password: body.password || 'ChangeMe123!',
      token: body.token,
    });
  }

  @UseGuards(AdminGuard)
  @Post('welcome')
  sendWelcome(@Body() body: { to?: string; name?: string; password?: string; loginUrl?: string }) {
    const to = body?.to?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }
    return this.emailService.sendWelcome({
      to,
      name: body.name,
      password: body.password || 'ChangeMe123!',
      loginUrl: body.loginUrl,
    });
  }

  @UseGuards(AdminGuard)
  @Post('reset')
  sendReset(@Body() body: { to?: string; name?: string; token?: string; resetPath?: string }) {
    const to = body?.to?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }
    if (!body?.token) {
      return { success: false, error: 'Reset token is required' };
    }
    return this.emailService.sendPasswordReset({
      to,
      name: body.name,
      token: body.token,
      resetPath: body.resetPath,
    });
  }

  @Post('login-otp')
  sendLoginOtp(@Body() body: { to?: string; otp?: string; expiresInMinutes?: number }) {
    const to = body?.to?.trim();
    const otp = body?.otp?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }
    if (!otp) {
      return { success: false, error: 'OTP is required' };
    }
    return this.emailService.sendLoginOtp({
      to,
      otp,
      expiresInMinutes: body.expiresInMinutes,
    });
  }

  @Post('verify')
  sendVerify(@Body() body: { to?: string; token?: string; verifyPath?: string }) {
    const to = body?.to?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }
    if (!body?.token) {
      return { success: false, error: 'Verification token is required' };
    }
    return this.emailService.sendVerification({
      to,
      token: body.token,
      verifyPath: body.verifyPath,
    });
  }
}
