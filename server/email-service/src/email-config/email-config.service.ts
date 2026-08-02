import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailConfigSettings } from './email-config.entity';
import { encryptSecret, decryptSecret } from '../common/crypto';

export type EmailConfigInput = {
  deliveryProvider?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPassword?: string;
  fromEmail?: string;
  fromName?: string;
  useTls?: boolean;
  azureTenantId?: string;
  azureClientId?: string;
  azureClientSecret?: string;
  graphSendAsUser?: string;
  frontendUrl?: string;
};

export type ResolvedEmailConfig = {
  provider: 'smtp' | 'graph';
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: { user?: string; pass?: string };
    from: string;
  };
  graph: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    sendAsUser: string;
  };
  frontendUrl: string;
};

@Injectable()
export class EmailConfigService {
  private static readonly SCOPE = 'default';

  constructor(
    @InjectRepository(EmailConfigSettings)
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

  getPublicConfig(config: EmailConfigSettings) {
    return {
      deliveryProvider: config.deliveryProvider || 'smtp',
      smtpHost: config.smtpHost || '',
      smtpPort: config.smtpPort || '587',
      smtpUser: config.smtpUser || '',
      smtpPassword: '',
      hasPassword: Boolean(config.smtpPassword),
      fromEmail: config.fromEmail || '',
      fromName: config.fromName || '',
      useTls: config.useTls !== false,
      azureTenantId: config.azureTenantId || '',
      azureClientId: config.azureClientId || '',
      azureClientSecret: '',
      hasAzureSecret: Boolean(config.azureClientSecret),
      graphSendAsUser: config.graphSendAsUser || '',
      frontendUrl: config.frontendUrl || '',
      updatedAt: config.updatedAt,
    };
  }

  async getConfig() {
    const config = await this.getOrCreate();
    return this.getPublicConfig(config);
  }

  async updateConfig(input: EmailConfigInput) {
    const config = await this.getOrCreate();

    if (input.deliveryProvider !== undefined) {
      const provider = String(input.deliveryProvider).trim().toLowerCase();
      config.deliveryProvider = provider === 'graph' ? 'graph' : 'smtp';
    }
    if (input.smtpHost !== undefined) config.smtpHost = input.smtpHost.trim() || null;
    if (input.smtpPort !== undefined) config.smtpPort = input.smtpPort.trim() || null;
    if (input.smtpUser !== undefined) config.smtpUser = input.smtpUser.trim() || null;
    if (input.fromEmail !== undefined) config.fromEmail = input.fromEmail.trim() || null;
    if (input.fromName !== undefined) config.fromName = input.fromName.trim() || null;
    if (input.useTls !== undefined) config.useTls = Boolean(input.useTls);

    if (input.smtpPassword !== undefined && input.smtpPassword.trim()) {
      config.smtpPassword = input.smtpPassword;
    }

    if (input.azureTenantId !== undefined) config.azureTenantId = input.azureTenantId.trim() || null;
    if (input.azureClientId !== undefined) config.azureClientId = input.azureClientId.trim() || null;
    if (input.graphSendAsUser !== undefined) config.graphSendAsUser = input.graphSendAsUser.trim() || null;
    if (input.frontendUrl !== undefined) config.frontendUrl = input.frontendUrl.trim() || null;

    // Encrypt on save; empty string means "keep existing".
    if (input.azureClientSecret !== undefined && input.azureClientSecret.trim()) {
      config.azureClientSecret = encryptSecret(input.azureClientSecret.trim());
    }

    const saved = await this.configRepository.save(config);
    return this.getPublicConfig(saved);
  }

  async getResolvedConfig(): Promise<ResolvedEmailConfig> {
    const config = await this.getOrCreate();

    const frontendUrl =
      (config.frontendUrl && config.frontendUrl.trim()) ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    // Graph takes precedence when explicitly selected AND all required env/DB values exist.
    const provider: 'smtp' | 'graph' =
      (config.deliveryProvider === 'graph' || process.env.EMAIL_DELIVERY_PROVIDER === 'graph') &&
      (config.azureClientId || process.env.AZURE_CLIENT_ID) &&
      (config.azureClientSecret || process.env.AZURE_CLIENT_SECRET)
        ? 'graph'
        : 'smtp';

    const port = parseInt(config.smtpPort || process.env.SMTP_PORT || '587', 10);
    const smtp = {
      host: config.smtpHost || process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: (config.useTls !== false) && port === 465,
      auth: {
        user: config.smtpUser || process.env.SMTP_USER || '',
        pass: config.smtpPassword || process.env.SMTP_PASS || '',
      },
      from: (() => {
        const fromEmail = config.fromEmail || process.env.SMTP_FROM || 'noreply@hashibasha.com';
        const fromName = config.fromName || 'Hashibasha';
        return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
      })(),
    };

    const storedSecret = config.azureClientSecret ? decryptSecret(config.azureClientSecret) : '';
    const graph = {
      tenantId: config.azureTenantId || process.env.AZURE_TENANT_ID || '',
      clientId: config.azureClientId || process.env.AZURE_CLIENT_ID || '',
      clientSecret: storedSecret || process.env.AZURE_CLIENT_SECRET || '',
      sendAsUser: config.graphSendAsUser || process.env.GRAPH_SEND_AS_USER || '',
    };

    return { provider, smtp, graph, frontendUrl };
  }
}
