import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailConfigService } from './email-config.service';

@Injectable()
export class EmailService {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  private async createTransporter() {
    const smtp = await this.emailConfigService.getResolvedSmtpConfig();
    return nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.auth.user
        ? { user: smtp.auth.user, pass: smtp.auth.pass }
        : undefined,
    });
  }

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<any> {
    const smtp = await this.emailConfigService.getResolvedSmtpConfig();
    const mailOptions = {
      from: smtp.from,
      to,
      subject,
      html,
      text,
    };

    try {
      const transporter = await this.createTransporter();
      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string): Promise<any> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const html = `
      <h1>Email Verification</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `;

    return await this.sendEmail(email, 'Verify Your Email', html);
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<any> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const html = `
      <h1>Password Reset</h1>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `;

    return await this.sendEmail(email, 'Reset Your Password', html);
  }

  async sendWelcomeEmail(input: {
    to: string;
    name?: string;
    password: string;
    loginUrl?: string;
  }): Promise<any> {
    const loginUrl =
      input.loginUrl ||
      `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;
    const displayName = input.name?.trim() || input.to;
    const subject = 'Your Hashibasha account details';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px;">
        <h1 style="color: #0f172a; font-size: 22px;">Welcome to Hashibasha</h1>
        <p>Hello ${displayName},</p>
        <p>Your account has been created. Use the details below to sign in:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Login username</td>
            <td style="padding: 8px 0;">${input.to}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Password</td>
            <td style="padding: 8px 0;">${input.password}</td>
          </tr>
        </table>
        <p>
          <a href="${loginUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px;">
            Open login page
          </a>
        </p>
        <p style="font-size: 13px; color: #64748b;">
          For security, change your password after your first login.
        </p>
      </div>
    `;
    const text = [
      `Hello ${displayName},`,
      '',
      'Your Hashibasha account has been created.',
      `Login username: ${input.to}`,
      `Password: ${input.password}`,
      `Login URL: ${loginUrl}`,
      '',
      'Please change your password after your first login.',
    ].join('\n');

    return await this.sendEmail(input.to, subject, html, text);
  }

  async sendLoginOtpEmail(input: {
    to: string;
    otp: string;
    expiresInMinutes?: number;
  }): Promise<any> {
    const expiresInMinutes = input.expiresInMinutes || 10;
    const subject = 'Your Hashibasha login verification code';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px;">
        <h1 style="color: #0f172a; font-size: 22px;">Login verification</h1>
        <p>Use the one-time password below to finish signing in.</p>
        <div style="margin: 24px 0; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center; background: #f8fafc;">
          <div style="font-size: 30px; letter-spacing: 8px; font-weight: 700;">${input.otp}</div>
        </div>
        <p>This code will expire in ${expiresInMinutes} minute(s).</p>
        <p style="font-size: 13px; color: #64748b;">
          If you did not try to sign in, you can ignore this email.
        </p>
      </div>
    `;
    const text = [
      'Your Hashibasha login verification code:',
      input.otp,
      '',
      `This code expires in ${expiresInMinutes} minute(s).`,
      'If you did not try to sign in, ignore this email.',
    ].join('\n');

    return this.sendEmail(input.to, subject, html, text);
  }
}
