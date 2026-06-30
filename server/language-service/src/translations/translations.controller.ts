import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { TranslationsService } from './translations.service';

@Controller()
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get('health')
  health() {
    return { status: 'ok', service: 'language-service' };
  }

  @Get('locale/:lang')
  getLocale(@Param('lang') lang: string) {
    return this.translationsService.getLocaleMap(lang);
  }

  @Get('entries')
  listEntries() {
    return this.translationsService.findAllEntries();
  }

  @Get('entries/:id')
  getEntry(@Param('id', ParseIntPipe) id: number) {
    return this.translationsService.findEntry(id);
  }

  @Post('entries')
  createEntry(@Body() body: { key: string; en: string; ar: string }) {
    return this.translationsService.createEntry(body);
  }

  @Put('entries/:id')
  updateEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { key?: string; en?: string; ar?: string },
  ) {
    return this.translationsService.updateEntry(id, body);
  }

  @Delete('entries/:id')
  removeEntry(@Param('id', ParseIntPipe) id: number) {
    return this.translationsService.removeEntry(id);
  }

  @Post('cache/clear')
  clearCache() {
    this.translationsService.clearCache();
    return { message: 'Language cache cleared' };
  }

  /** Backward-compatible route used by existing gateway/i18n clients */
  @Get('translations/:lang')
  getTranslationsLegacy(@Param('lang') lang: string) {
    return this.translationsService.getLocaleMap(lang);
  }
}
