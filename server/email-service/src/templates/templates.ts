export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

function shell(title: string, bodyHtml: string, footerText?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 560px; margin: 0 auto;">
      <h1 style="color: #0f172a; font-size: 22px; margin-bottom: 16px;">${title}</h1>
      ${bodyHtml}
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
        ${footerText || 'You are receiving this email from the Hashibasha platform.'}
      </p>
    </div>
  `;
}

export function welcomeEmail(input: {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}): EmailTemplate {
  const subject = 'Your Hashibasha account details';
  const html = shell(
    'Welcome to Hashibasha',
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
    <p><a href="${input.loginUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px;">Open login page</a></p>
    <p style="font-size: 13px; color: #64748b;">For security, change your password after your first login.</p>
    `,
  );
  const text = [
    `Hello ${input.name},`,
    '',
    'Your Hashibasha account has been created.',
    `Login username: ${input.email}`,
    `Password: ${input.password}`,
    `Login URL: ${input.loginUrl}`,
    '',
    'Please change your password after your first login.',
  ].join('\n');
  return { subject, html, text };
}

export function passwordResetEmail(input: {
  name: string;
  resetUrl: string;
}): EmailTemplate {
  const subject = 'Reset your Hashibasha password';
  const html = shell(
    'Password reset',
    `
    <p>Hello ${input.name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <p><a href="${input.resetUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px;">Reset password</a></p>
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

export function otpEmail(input: {
  otp: string;
  expiresInMinutes: number;
}): EmailTemplate {
  const subject = 'Your Hashibasha login verification code';
  const html = shell(
    'Login verification',
    `
    <p>Use the one-time password below to finish signing in:</p>
    <div style="margin: 24px 0; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; text-align: center; background: #f8fafc;">
      <div style="font-size: 30px; letter-spacing: 8px; font-weight: 700;">${input.otp}</div>
    </div>
    <p>This code expires in ${input.expiresInMinutes} minute(s).</p>
    `,
    'If you did not try to sign in, you can ignore this email.',
  );
  const text = [
    'Your Hashibasha login verification code:',
    input.otp,
    '',
    `This code expires in ${input.expiresInMinutes} minute(s).`,
    'If you did not try to sign in, ignore this email.',
  ].join('\n');
  return { subject, html, text };
}

export function verifyEmail(input: {
  verifyUrl: string;
}): EmailTemplate {
  const subject = 'Verify your Hashibasha email';
  const html = shell(
    'Email verification',
    `
    <p>Please click the button below to verify your email address:</p>
    <p><a href="${input.verifyUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px;">Verify email</a></p>
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
