import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LanguageEntry } from './language-entry.entity';

type LocaleMap = Record<string, string>;

@Injectable()
export class TranslationsService {
  private localeCache: Partial<Record<'en' | 'ar', LocaleMap>> = {};

  constructor(
    @InjectRepository(LanguageEntry, 'language')
    private readonly entriesRepository: Repository<LanguageEntry>,
  ) {}

  clearCache() {
    this.localeCache = {};
  }

  private assertLocale(locale: string): 'en' | 'ar' {
    if (locale !== 'en' && locale !== 'ar') {
      throw new BadRequestException('Invalid language. Use "en" or "ar"');
    }
    return locale;
  }

  async getLocaleMap(localeInput: string): Promise<LocaleMap> {
    const locale = this.assertLocale(localeInput);
    if (this.localeCache[locale]) {
      return this.localeCache[locale]!;
    }

    const entries = await this.entriesRepository.find({ order: { key: 'ASC' } });
    const map: LocaleMap = {};
    for (const entry of entries) {
      map[entry.key] = locale === 'en' ? entry.en : entry.ar;
    }
    this.localeCache[locale] = map;
    return map;
  }

  findAllEntries() {
    return this.entriesRepository.find({ order: { key: 'ASC' } });
  }

  async findEntry(id: number) {
    const entry = await this.entriesRepository.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Translation entry not found');
    return entry;
  }

  async createEntry(data: { key: string; en: string; ar: string }) {
    this.clearCache();
    const entry = this.entriesRepository.create(data);
    return this.entriesRepository.save(entry);
  }

  async updateEntry(id: number, data: Partial<Pick<LanguageEntry, 'key' | 'en' | 'ar'>>) {
    await this.findEntry(id);
    this.clearCache();
    await this.entriesRepository.update(id, data);
    return this.findEntry(id);
  }

  async removeEntry(id: number) {
    await this.findEntry(id);
    this.clearCache();
    await this.entriesRepository.delete(id);
    return { deleted: true };
  }
}
