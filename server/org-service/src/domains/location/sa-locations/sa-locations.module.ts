import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaRegion } from './sa-region.entity';
import { SaCity } from './sa-city.entity';
import { SaDistrict } from './sa-district.entity';
import { SaLocationsService } from './sa-locations.service';
import { SaLocationsController } from './sa-locations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SaRegion, SaCity, SaDistrict], 'location')],
  controllers: [SaLocationsController],
  providers: [SaLocationsService],
  exports: [SaLocationsService],
})
export class SaLocationsModule {}
