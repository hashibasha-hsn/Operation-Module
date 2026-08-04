import { Injectable, BadRequestException, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SnapshotEmailSettings } from './snapshot-email-settings.entity';
import { EmailService } from '../email.service';
import { snapshotEmail } from '../templates/templates';

export type SnapshotEmailConfigInput = {
  enabled?: boolean;
  frequency?: string;
  timeOfDay?: string;
  recipients?: string;
  snapshotDate?: string | null;
  organizationName?: string;
};

@Injectable()
export class SnapshotEmailService implements OnModuleDestroy {
  private readonly logger = new Logger(SnapshotEmailService.name);
  private timer: NodeJS.Timeout | null = null;

  private readonly ORG_SERVICE_URL =
    process.env.ORG_SERVICE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'http://org-service.railway.internal:8080'
      : 'http://localhost:3012');

  constructor(
    @InjectRepository(SnapshotEmailSettings)
    private readonly settingsRepository: Repository<SnapshotEmailSettings>,
    private readonly emailService: EmailService,
  ) {
    // Check every minute whether any enabled schedule is due.
    this.timer = setInterval(() => {
      void this.checkSchedules();
    }, 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async getSettings(organizationId: string): Promise<SnapshotEmailSettings> {
    let settings = await this.settingsRepository.findOne({
      where: { organizationId },
    });
    if (!settings) {
      settings = this.settingsRepository.create({
        organizationId,
        enabled: false,
        frequency: 'daily',
        timeOfDay: '09:00',
        recipients: null,
        snapshotDate: null,
      });
      settings = await this.settingsRepository.save(settings);
    }
    return settings;
  }

  publicConfig(settings: SnapshotEmailSettings) {
    return {
      organizationId: settings.organizationId,
      enabled: settings.enabled,
      frequency: settings.frequency || 'daily',
      timeOfDay: settings.timeOfDay || '09:00',
      recipients: settings.recipients || '',
      snapshotDate: settings.snapshotDate || null,
      lastSentAt: settings.lastSentAt,
    };
  }

  async updateSettings(organizationId: string, input: SnapshotEmailConfigInput) {
    const settings = await this.getSettings(organizationId);

    if (input.enabled !== undefined) settings.enabled = Boolean(input.enabled);
    if (input.frequency !== undefined) {
      const frequency = String(input.frequency).trim().toLowerCase();
      if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
        throw new BadRequestException('frequency must be one of: daily, weekly, monthly');
      }
      settings.frequency = frequency;
    }
    if (input.timeOfDay !== undefined) {
      const time = String(input.timeOfDay).trim();
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw new BadRequestException('timeOfDay must be in HH:mm format');
      }
      settings.timeOfDay = time;
    }
    if (input.recipients !== undefined) {
      settings.recipients = input.recipients?.trim() || null;
    }
    if (input.snapshotDate !== undefined) {
      settings.snapshotDate = input.snapshotDate?.trim() || null;
    }

    const saved = await this.settingsRepository.save(settings);
    return this.publicConfig(saved);
  }

  private parseRecipients(settings: SnapshotEmailSettings): string[] {
    const raw = settings.recipients || '';
    return raw
      .split(/[\n,;]+/)
      .map((addr) => addr.trim())
      .filter((addr) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr));
  }

  async sendSnapshotEmail(organizationId: string, forceDate?: string): Promise<{ sentTo: string[]; snapshotDate: string }> {
    const settings = await this.getSettings(organizationId);
    const recipients = this.parseRecipients(settings);
    if (recipients.length === 0) {
      throw new BadRequestException('No valid recipient emails configured');
    }

    const snapshotDate = forceDate || settings.snapshotDate || new Date().toISOString().slice(0, 10);

    const snapshot = await this.fetchSnapshot(organizationId, snapshotDate);

    const template = snapshotEmail(
      await this.getTheme(),
      {
        dateLabel: snapshotDate,
        stores: snapshot.stores,
        processes: snapshot.processes,
        snapshotUrl: this.buildSnapshotUrl(snapshotDate),
      },
    );

    const result = await this.emailService.send({
      to: recipients,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    settings.lastSentAt = new Date();
    await this.settingsRepository.save(settings);

    this.logger.log(
      `Snapshot email sent to ${recipients.join(', ')} for ${organizationId}` +
        (result?.success ? ' (success)' : result?.error ? ` (${result.error})` : ''),
    );
    return { sentTo: recipients, snapshotDate };
  }

  async sendTestEmail(organizationId: string, to: string): Promise<{ sentTo: string[]; snapshotDate: string }> {
    const settings = await this.getSettings(organizationId);
    const snapshotDate = settings.snapshotDate || new Date().toISOString().slice(0, 10);
    const snapshot = await this.fetchSnapshot(organizationId, snapshotDate);

    const template = snapshotEmail(await this.getTheme(), {
      dateLabel: snapshotDate,
      stores: snapshot.stores,
      processes: snapshot.processes,
      snapshotUrl: this.buildSnapshotUrl(snapshotDate),
    });

    await this.emailService.send({
      to: [to],
      subject: `[Test] ${template.subject}`,
      html: template.html,
      text: template.text,
    });

    return { sentTo: [to], snapshotDate };
  }

  private async getTheme() {
    const config = await this.emailService.getResolvedConfig();
    return config.theme;
  }

  private buildSnapshotUrl(snapshotDate: string): string {
    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl.replace(/\/$/, '')}/executive-dashboard?tab=snapshot&date=${encodeURIComponent(snapshotDate)}`;
  }

  private async fetchSnapshot(organizationId: string, date: string) {
    try {
      const url = `${this.ORG_SERVICE_URL}/executive-dashboard/snapshot?organizationId=${encodeURIComponent(organizationId)}&date=${encodeURIComponent(date)}`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) {
        this.logger.warn(
          `Snapshot data fetch failed for ${organizationId}: HTTP ${response.status}. Sending empty tables.`,
        );
        return { stores: [], processes: [] };
      }
      const stores = Array.isArray(data.stores)
        ? data.stores.map((s: any) => ({
            storeName: s.storeName,
            region: s.region,
            average: data.snapshot?.[s.storeId]?.average ?? 0,
          }))
        : [];

      const processTotals: Record<string, { name: string; sum: number; count: number }> = {};
      const processNames: Record<string, string> = {};
      if (Array.isArray(data.processes)) {
        data.processes.forEach((p: any) => {
          processNames[p.processId] = p.processName;
          processTotals[p.processId] = { name: p.processName, sum: 0, count: 0 };
        });
      }
      const snapshot: any = data.snapshot || {};
      Object.values(snapshot).forEach((storeRow: any) => {
        Object.entries(storeRow?.processes || {}).forEach(([procId, cell]: any) => {
          if (!processTotals[procId]) {
            processTotals[procId] = {
              name: cell?.processName || processNames[procId] || 'Untitled',
              sum: 0,
              count: 0,
            };
          }
          if (processTotals[procId]) {
            processTotals[procId].sum += Number(cell?.completionPercentage || 0);
            processTotals[procId].count += 1;
          }
        });
      });
      const processes = Object.values(processTotals).map((p) => ({
        processName: p.name,
        completionPercentage: p.count > 0 ? Math.round(p.sum / p.count) : 0,
      }));
      return { stores, processes };
    } catch (error: any) {
      this.logger.warn(
        `Snapshot data fetch failed for ${organizationId}: ${error?.message}. Sending empty tables.`,
      );
      return { stores: [], processes: [] };
    }
  }

  async checkSchedules(): Promise<void> {
    const settingsList = await this.settingsRepository.find({ where: { enabled: true } });
    const now = new Date();
    for (const settings of settingsList) {
      try {
        if (this.isDue(settings, now)) {
          await this.sendSnapshotEmail(settings.organizationId);
        }
      } catch (error: any) {
        this.logger.error(
          `Scheduled snapshot email failed for ${settings.organizationId}: ${error?.message}`,
        );
      }
    }
  }

  private isDue(settings: SnapshotEmailSettings, now: Date): boolean {
    const today = now.toISOString().slice(0, 10);
    const [hour, minute] = String(settings.timeOfDay || '09:00').split(':').map(Number);
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const targetMinutes = (hour || 0) * 60 + (minute || 0);

    if (currentMinutes < targetMinutes) return false;

    const lastSent = settings.lastSentAt ? new Date(settings.lastSentAt) : null;

    switch (settings.frequency || 'daily') {
      case 'daily':
        if (lastSent && lastSent.toISOString().slice(0, 10) === today) return false;
        break;
      case 'weekly':
        if (lastSent) {
          const lastWeek = this.weekKey(lastSent);
          if (lastWeek === this.weekKey(now)) return false;
        }
        break;
      case 'monthly':
        if (lastSent && lastSent.toISOString().slice(0, 7) === today.slice(0, 7)) return false;
        break;
    }
    return true;
  }

  private weekKey(date: Date): string {
    const d = new Date(date);
    const day = (d.getUTCDay() + 6) % 7;
    d.setUTCDate(d.getUTCDate() - day);
    return d.toISOString().slice(0, 10);
  }
}
