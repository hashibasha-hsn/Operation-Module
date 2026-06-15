import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { Feature } from './feature.entity';

@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Post()
  create(@Body() createFeatureDto: Partial<Feature>) {
    return this.featuresService.create(createFeatureDto);
  }

  @Get()
  findAll() {
    return this.featuresService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.featuresService.findOne(id);
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string) {
    return this.featuresService.findByCategory(category);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateFeatureDto: Partial<Feature>) {
    return this.featuresService.update(id, updateFeatureDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.featuresService.remove(id);
  }
}
