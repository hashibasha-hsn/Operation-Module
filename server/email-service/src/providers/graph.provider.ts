import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, SendMailInput, SendMailResult } from './email-provider.interface';
import { ResolvedEmailConfig } from '../email-config/email-config.service';

const TOKEN_URL = 'https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token';
const SEND_URL = 'https://graph.microsoft.com/v1.0/users/{user}/sendMail';

interface CachedToken {
  value: string;
  expiresAt: number;
}

@Injectable()
export class GraphEmailProvider implements EmailProvider {
  name = 'graph' as const;
  private readonly logger = new Logger(GraphEmailProvider.name);
  private tokenCache: CachedToken | null = null;

  private async getAccessToken(config: ResolvedEmailConfig): Promise<string> {
    if (
      this.tokenCache &&
      this.tokenCache.expiresAt > Date.now() + 60_000
    ) {
      return this.tokenCache.value;
    }

    const url = TOKEN_URL.replace('{tenant}', encodeURIComponent(config.graph.tenantId));
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.graph.clientId,
      client_secret: config.graph.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.access_token) {
      throw new Error(
        `Graph token error (${res.status}): ${data?.error_description || data?.error || 'unknown'}`,
      );
    }

    this.tokenCache = {
      value: data.access_token,
      expiresAt: Date.now() + (Number(data.expires_in || 3600) * 1000),
    };
    return data.access_token;
  }

  async send(
    config: ResolvedEmailConfig,
    input: SendMailInput,
  ): Promise<SendMailResult> {
    const recipients = (Array.isArray(input.to) ? input.to : [input.to])
      .map((addr) => addr.trim())
      .filter(Boolean);
    if (recipients.length === 0) {
      return { success: false, error: 'Recipient email is required' };
    }

    const token = await this.getAccessToken(config);
    const sendUrl = SEND_URL.replace('{user}', encodeURIComponent(config.graph.sendAsUser));

    const message: any = {
      subject: input.subject,
      body: {
        contentType: 'HTML',
        content: input.html,
      },
      toRecipients: recipients.map((addr) => ({ emailAddress: { address: addr } })),
    };

    if (input.cc?.length) {
      message.ccRecipients = input.cc.map((addr) => ({ emailAddress: { address: addr } }));
    }
    if (input.replyTo) {
      message.replyTo = [{ emailAddress: { address: input.replyTo } }];
    }

    const res = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, saveToSentItems: true }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      this.logger.error(`Graph sendMail failed (${res.status}): ${errBody.slice(0, 500)}`);
      return {
        success: false,
        error: `Graph sendMail failed (${res.status})`,
      };
    }

    const requestId = res.headers.get('request-id') || '';
    return { success: true, messageId: requestId || undefined };
  }
}
