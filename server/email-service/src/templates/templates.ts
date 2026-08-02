import { ResolvedEmailTheme } from '../email-config/email-config.service';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function shell(theme: ResolvedEmailTheme, title: string, bodyHtml: string, footerText?: string): string {
  const headerGradient = `linear-gradient(135deg, ${theme.headerGradientStart} 0%, ${theme.headerGradientEnd} 100%)`;
  const brandHtml = theme.logoUrl
    ? `<img src="${theme.logoUrl}" alt="${theme.brandName}" style="max-height: 44px; max-width: 180px; display: block;" />`
    : `<h1 style="color: #ffffff; font-size: 22px; margin: 0;">${title}</h1>`;
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
      <div style="background: ${headerGradient}; border-radius: 10px 10px 0 0; padding: 24px 28px;">
        ${brandHtml}
      </div>
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px; padding: 24px 28px;">
        ${bodyHtml}
      </div>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center;">
        ${footerText || theme.footerText}
      </p>
    </div>
  `;
}

function buttonHtml(theme: ResolvedEmailTheme, href: string, label: string, extraStyle = ''): string {
  return `<a href="${href}" style="display: inline-block; background: ${theme.buttonColor}; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 16px; font-weight: 600; ${extraStyle}">${label}</a>`;
}

export function accountActivationEmail(
  theme: ResolvedEmailTheme,
  input: {
    name: string;
    email: string;
    password: string;
    activationUrl: string;
    loginUrl: string;
  },
): EmailTemplate {
  const subject = `Activate your ${theme.brandName} admin account`;
  const html = shell(
    theme,
    `Welcome to ${theme.brandName}`,
    `
    <p>Hello ${input.name},</p>
    <p>Your ${theme.brandName} administrator account has been created. To start using it, please activate your account by clicking the button below:</p>
    <p style="text-align: center; margin: 28px 0;">
      ${buttonHtml(theme, input.activationUrl, 'Activate my account')}
    </p>
    <p style="font-size: 13px; color: #64748b; text-align: center;">This link expires in 72 hours.</p>
    <div style="margin: 24px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
      <p style="margin: 0 0 12px; font-weight: 600; color: #0f172a;">Your login credentials</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; width: 40%;">Email</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${input.email}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b;">Password</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${input.password}</td>
        </tr>
      </table>
    </div>
    <p><a href="${input.loginUrl}" style="color: ${theme.primaryColor};">Go to login page</a></p>
    <p style="font-size: 13px; color: #64748b;">For security, please change your password after your first login.</p>
    `,
    'If you did not create this account, you can safely ignore this email.',
  );
  const text = [
    `Hello ${input.name},`,
    '',
    `Your ${theme.brandName} administrator account has been created.`,
    'Activate your account by opening:',
    input.activationUrl,
    '',
    'Login username:',
    input.email,
    '',
    'Password:',
    input.password,
    '',
    'Login URL:',
    input.loginUrl,
    '',
    'This activation link expires in 72 hours.',
    'Please change your password after your first login.',
  ].join('\n');
  return { subject, html, text };
}

export function welcomeEmail(
  theme: ResolvedEmailTheme,
  input: {
    name: string;
    email: string;
    password: string;
    loginUrl: string;
  },
): EmailTemplate {
  const subject = `Your ${theme.brandName} account details`;
  const html = shell(
    theme,
    `Welcome to ${theme.brandName}`,
    `
    <p>Hello ${input.name},</p>
    <p>Your account has been created. Use the details below to sign in:</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Login username</td>
        <td style="padding: 8px 0;">${input.email}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Password</td>
        <td style="padding: 8px 0;">${input.password}</td>
      </tr>
    </table>
    <p>${buttonHtml(theme, input.loginUrl, 'Open login page', 'padding: 10px 18px; font-size: 14px;')}</p>
    <p style="font-size: 13px; color: #64748b;">For security, change your password after your first login.</p>
    `,
  );
  const text = [
    `Hello ${input.name},`,
    '',
    `Your ${theme.brandName} account has been created.`,
    `Login username: ${input.email}`,
    `Password: ${input.password}`,
    `Login URL: ${input.loginUrl}`,
    '',
    'Please change your password after your first login.',
  ].join('\n');
  return { subject, html, text };
}

export function passwordResetEmail(
  theme: ResolvedEmailTheme,
  input: {
    name: string;
    resetUrl: string;
  },
): EmailTemplate {
  const subject = `Reset your ${theme.brandName} password`;
  const html = shell(
    theme,
    'Password reset',
    `
    <p>Hello ${input.name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <p>${buttonHtml(theme, input.resetUrl, 'Reset password', 'padding: 10px 18px; font-size: 14px;')}</p>
    <p style="font-size: 13px; color: #64748b;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
    `,
  );
  const text = [
    `Hello ${input.name},`,
    '',
    'We received a request to reset your password.',
    `Reset link: ${input.resetUrl}`,
    '',
    'This link expires in 1 hour. If you did not request this, ignore this email.',
  ].join('\n');
  return { subject, html, text };
}

export function otpEmail(
  theme: ResolvedEmailTheme,
  input: {
    otp: string;
    expiresInMinutes: number;
  },
): EmailTemplate {
  const subject = `Your ${theme.brandName} login verification code`;
  const html = shell(
    theme,
    'Login verification',
    `
    <p>Use the one-time password below to finish signing in:</p>
    <div style="margin: 24px 0; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center; background: #f8fafc;">
      <div style="font-size: 30px; letter-spacing: 8px; font-weight: 700; color: ${theme.primaryColor};">${input.otp}</div>
    </div>
    <p>This code expires in ${input.expiresInMinutes} minute(s).</p>
    `,
    'If you did not try to sign in, you can ignore this email.',
  );
  const text = [
    `Your ${theme.brandName} login verification code:`,
    input.otp,
    '',
    `This code expires in ${input.expiresInMinutes} minute(s).`,
    'If you did not try to sign in, ignore this email.',
  ].join('\n');
  return { subject, html, text };
}

export function verifyEmail(
  theme: ResolvedEmailTheme,
  input: {
    verifyUrl: string;
  },
): EmailTemplate {
  const subject = `Verify your ${theme.brandName} email`;
  const html = shell(
    theme,
    'Email verification',
    `
    <p>Please click the button below to verify your email address:</p>
    <p>${buttonHtml(theme, input.verifyUrl, 'Verify email', 'padding: 10px 18px; font-size: 14px;')}</p>
    <p style="font-size: 13px; color: #64748b;">This link expires in 24 hours.</p>
    `,
  );
  const text = [
    'Please verify your email address by opening:',
    input.verifyUrl,
    '',
    'This link expires in 24 hours.',
  ].join('\n');
  return { subject, html, text };
}
