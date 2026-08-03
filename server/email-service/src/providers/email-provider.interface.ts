import { ResolvedEmailConfig } from '../email-config/email-config.service';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  encoding?: string;
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendMailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  name: 'smtp' | 'graph';
  send(config: ResolvedEmailConfig, input: SendMailInput): Promise<SendMailResult>;
}
