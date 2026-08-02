import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UiSettings } from './ui-settings.entity';

@Injectable()
export class UiSettingsService {
  constructor(
    @InjectRepository(UiSettings, 'org')
    private readonly settingsRepository: Repository<UiSettings>,
  ) {}

  async get(organizationId: string) {
    let settings = await this.settingsRepository.findOne({
      where: { organizationId },
    });
    if (!settings) {
      settings = await this.settingsRepository.save(
        this.settingsRepository.create({ organizationId, theme: {} }),
      );
    }
    return settings;
  }

  async update(
    organizationId: string,
    theme: Record<string, unknown>,
    updatedBy?: string,
  ) {
    const existing = await this.settingsRepository.findOne({
      where: { organizationId },
    });
    const payload = {
      organizationId,
      theme: theme ?? {},
      updatedBy: updatedBy || 'system',
    };
    if (existing) {
      await this.settingsRepository.update(existing.id, payload as any);
      return this.get(organizationId);
    }
    return this.settingsRepository.save(
      this.settingsRepository.create(payload as any),
    );
  }
}
