import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
  ForbiddenException,
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

  @Post('process-assigned')
  async sendProcessAssigned(
    @Req() req: any,
    @Body() body: {
      to?: string;
      name?: string;
      processTitle?: string;
      processId?: string;
      assignedBy?: string;
    },
  ) {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (token && req?.headers?.['x-service-token'] !== token) {
      throw new ForbiddenException('Invalid service token');
    }
    const to = body?.to?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }
    if (!body?.processTitle?.trim()) {
      return { success: false, error: 'Process title is required' };
    }
    if (!body?.processId?.trim()) {
      return { success: false, error: 'Process id is required' };
    }
    return this.emailService.sendProcessAssigned({
      to,
      name: body.name,
      processTitle: body.processTitle,
      processId: body.processId,
      assignedBy: body.assignedBy,
    });
  }

  @Post('submission-report')
  async sendSubmissionReport(
    @Req() req: any,
    @Body() body: {
      to?: string[];
      names?: string[];
      processTitle?: string;
      submissionId?: string;
      report?: {
        processTitle: string;
        workflowType?: string;
        submittedBy?: string;
        storeName?: string;
        submittedAt?: string;
        status?: string;
        sections: Array<{
          title: string;
          questions: Array<{ questionText: string; questionType?: string; answer?: unknown }>;
        }>;
      };
    },
  ) {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (token && req?.headers?.['x-service-token'] !== token) {
      throw new ForbiddenException('Invalid service token');
    }
    const to = (body?.to ?? []).map((addr) => addr?.trim()).filter(Boolean);
    if (to.length === 0) {
      return { success: false, error: 'At least one recipient email is required' };
    }
    if (!body?.processTitle?.trim()) {
      return { success: false, error: 'Process title is required' };
    }
    if (!body?.submissionId?.trim()) {
      return { success: false, error: 'Submission id is required' };
    }
    return this.emailService.sendSubmissionReport({
      to,
      names: body.names,
      processTitle: body.processTitle,
      submissionId: body.submissionId,
      report: body.report ?? { processTitle: body.processTitle, sections: [] },
    });
  }

  @Post('password-reset')
  sendPasswordReset(@Body() body: { to?: string; token?: string; resetPath?: string }) {
    const to = body?.to?.trim();
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }
    if (!body?.token) {
      return { success: false, error: 'Reset token is required' };
    }
    return this.emailService.sendPasswordReset({
      to,
      token: body.token,
      resetPath: body.resetPath,
    });
  }
}
