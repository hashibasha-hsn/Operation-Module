import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailConfigSettings } from './email-config.entity';

export type EmailConfigInput = {
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
  useTls?: boolean;
};

export type ResolvedSmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user?: string;
    pass?: string;
  };
  from: string;
};

@Injectable()
export class EmailConfigService {
  private static readonly SCOPE = 'default';

  constructor(
    @InjectRepository(EmailConfigSettings, 'notification')
    private readonly configRepository: Repository<EmailConfigSettings>,
  ) {}

  private async getOrCreate(): Promise<EmailConfigSettings> {
    let config = await this.configRepository.findOne({
      where: { scopeKey: EmailConfigService.SCOPE },
    });

    if (!config) {
      config = this.configRepository.create({
        scopeKey: EmailConfigService.SCOPE,
        smtpPort: '587',
        useTls: true,
      });
      config = await this.configRepository.save(config);
    }

    return config;
  }

  async getPublicConfig() {
    const config = await this.getOrCreate();
    return {
      smtpHost: config.smtpHost || '',
      smtpPort: config.smtpPort || '587',
      smtpUser: config.smtpUser || '',
      smtpPassword: '',
      fromEmail: config.fromEmail || '',
      fromName: config.fromName || '',
      useTls: config.useTls !== false,
      hasPassword: Boolean(config.smtpPassword),
      updatedAt: config.updatedAt,
    };
  }

  async updateConfig(input: EmailConfigInput) {
    const config = await this.getOrCreate();

    if (input.smtpHost !== undefined) config.smtpHost = input.smtpHost.trim() || null;
    if (input.smtpPort !== undefined) config.smtpPort = input.smtpPort.trim() || null;
    if (input.smtpUser !== undefined) config.smtpUser = input.smtpUser.trim() || null;
    if (input.fromEmail !== undefined) config.fromEmail = input.fromEmail.trim() || null;
    if (input.fromName !== undefined) config.fromName = input.fromName.trim() || null;
    if (input.useTls !== undefined) config.useTls = Boolean(input.useTls);

    if (input.smtpPassword !== undefined && input.smtpPassword.trim()) {
      config.smtpPassword = input.smtpPassword;
    }

    const saved = await this.configRepository.save(config);
    return this.toPublic(saved);
  }

  async getResolvedSmtpConfig(): Promise<ResolvedSmtpConfig> {
    const config = await this.getOrCreate();
    const port = parseInt(
      config.smtpPort || process.env.SMTP_PORT || '587',
      10,
    );
    const host = config.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com';
    const user = config.smtpUser || process.env.SMTP_USER || '';
    const pass = config.smtpPassword || process.env.SMTP_PASS || '';
    const fromEmail = config.fromEmail || process.env.SMTP_FROM || 'noreply@hashibasha.com';
    const fromName = config.fromName || 'Hashibasha';
    const useTls = config.useTls !== false;

    return {
      host,
      port,
      secure: useTls && port === 465,
      auth: { user, pass },
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    };
  }

  private toPublic(config: EmailConfigSettings) {
    return {
      smtpHost: config.smtpHost || '',
      smtpPort: config.smtpPort || '587',
      smtpUser: config.smtpUser || '',
      smtpPassword: '',
      fromEmail: config.fromEmail || '',
      fromName: config.fromName || '',
      useTls: config.useTls !== false,
      hasPassword: Boolean(config.smtpPassword),
      updatedAt: config.updatedAt,
    };
  }
}
