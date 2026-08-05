import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './asset.entity';
import { AssetTable } from './asset-table.entity';
import { AssetFilter } from './asset-filter.entity';
import { SupabaseStorageService } from '../noticeboard/supabase-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Asset, AssetTable, AssetFilter], 'org')],
  controllers: [AssetsController],
  providers: [AssetsService, SupabaseStorageService],
  exports: [AssetsService],
})
export class AssetsModule {}
