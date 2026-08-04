import { Injectable } from '@nestjs/common';
import { EmailConfigService } from './email-config/email-config.service';
import { GraphEmailProvider } from './providers/graph.provider';
import { SmtpEmailProvider } from './providers/smtp.provider';
import { SendMailInput, SendMailResult } from './providers/email-provider.interface';
import {
  welcomeEmail,
  accountActivationEmail,
  passwordResetEmail,
  otpEmail,
  verifyEmail,
  processAssignedEmail,
  submissionReportEmail,
} from './templates/templates';
import { generateReportPdf, SubmissionReport } from './report/report-pdf';

@Injectable()
export class EmailService {
  constructor(
    private readonly emailConfigService: EmailConfigService,
    private readonly graphProvider: GraphEmailProvider,
    private readonly smtpProvider: SmtpEmailProvider,
  ) {}

  async getResolvedConfig() {
    return this.emailConfigService.getResolvedConfig();
  }

  async send(input: SendMailInput): Promise<SendMailResult> {
    const config = await this.emailConfigService.getResolvedConfig();
    const provider =
      config.provider === 'graph' ? this.graphProvider : this.smtpProvider;
    return provider.send(config, input);
  }

  async sendAccountActivation(input: {
    to: string;
    name?: string;
    password: string;
    token: string;
  }): Promise<SendMailResult> {
    const config = await this.emailConfigService.getResolvedConfig();
    const base = config.frontendUrl.replace(/\/$/, '');
    const activationUrl = `${base}/api/auth/activate-account?token=${encodeURIComponent(input.token)}`;
    const loginUrl = `${base}/login`;
    const displayName = input.name?.trim() || input.to;
    const template = accountActivationEmail(config.theme, {
      name: displayName,
      email: input.to,
      password: input.password,
      activationUrl,
      loginUrl,
    });
    return this.send({
      to: input.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendWelcome(input: {
    to: string;
    name?: string;
    password: string;
    loginUrl?: string;
  }): Promise<SendMailResult> {
    const config = await this.emailConfigService.getResolvedConfig();
    const loginUrl =
      input.loginUrl || `${config.frontendUrl.replace(/\/$/, '')}/login`;
    const displayName = input.name?.trim() || input.to;
    const template = welcomeEmail(config.theme, {
      name: displayName,
      email: input.to,
      password: input.password,
      loginUrl,
    });
    return this.send({
      to: input.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendPasswordReset(input: {
    to: string;
    name?: string;
    token: string;
    resetPath?: string;
  }): Promise<SendMailResult> {
    const config = await this.emailConfigService.getResolvedConfig();
    const base = config.frontendUrl.replace(/\/$/, '');
    const resetPath = input.resetPath || '/reset-password';
    const resetUrl = `${base}${resetPath}?token=${encodeURIComponent(input.token)}`;
    const displayName = input.name?.trim() || input.to;
    const template = passwordResetEmail(config.theme, {
      name: displayName,
      resetUrl,
    });
    return this.send({
      to: input.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendLoginOtp(input: {
    to: string;
    otp: string;
    expiresInMinutes?: number;
  }): Promise<SendMailResult> {
    const config = await this.emailConfigService.getResolvedConfig();
    const template = otpEmail(config.theme, {
      otp: input.otp,
      expiresInMinutes: input.expiresInMinutes || 10,
    });
    return this.send({
      to: input.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendVerification(input: {
    to: string;
    token: string;
    verifyPath?: string;
  }): Promise<SendMailResult> {
    const config = await this.emailConfigService.getResolvedConfig();
    const base = config.frontendUrl.replace(/\/$/, '');
    const verifyPath = input.verifyPath || '/verify-email';
    const verifyUrl = `${base}${verifyPath}?token=${encodeURIComponent(input.token)}`;
    const template = verifyEmail(config.theme, { verifyUrl });
    return this.send({
      to: input.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendProcessAssigned(input: {
    to: string;
    name?: string;
    processTitle: string;
    processId: string;
    assignedBy?: string;
  }): Promise<SendMailResult> {
    const config = await this.emailConfigService.getResolvedConfig();
    const base = config.frontendUrl.replace(/\/$/, '');
    const taskUrl = `${base}/tasks/process/${encodeURIComponent(input.processId)}`;
    const displayName = input.name?.trim() || input.to;
    const template = processAssignedEmail(config.theme, {
      name: displayName,
      processTitle: input.processTitle,
      taskUrl,
      assignedBy: input.assignedBy,
    });
    return this.send({
      to: input.to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendSubmissionReport(input: {
    to: string[];
    names?: string[];
    processTitle: string;
    submissionId: string;
    report: SubmissionReport;
  }): Promise<SendMailResult> {
    const config = await this.emailConfigService.getResolvedConfig();
    const base = config.frontendUrl.replace(/\/$/, '');
    const reportUrl = `${base}/approvals?submission=${encodeURIComponent(input.submissionId)}`;
    const pdfBuffer = await generateReportPdf(input.report);
    const recipients = input.to;
    const displayName = input.names?.[0]?.trim() || recipients[0] || 'there';
    const template = submissionReportEmail(config.theme, {
      name: displayName,
      processTitle: input.processTitle,
      submissionId: input.submissionId,
      reportUrl,
    });
    return this.send({
      to: recipients,
      subject: template.subject,
      html: template.html,
      text: template.text,
      attachments: [
        {
          filename: `${input.processTitle.replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-') || 'submission-report'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }
}
