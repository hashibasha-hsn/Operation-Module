import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LanguageEntry } from './language-entry.entity';
import { TranslationsService } from './translations.service';
import { TranslationsController } from './translations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LanguageEntry], 'language')],
  controllers: [TranslationsController],
  providers: [TranslationsService],
})
export class TranslationsModule {}
