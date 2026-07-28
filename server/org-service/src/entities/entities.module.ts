import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesService } from './entities.service';
import { EntitiesController } from './entities.controller';
import { BusinessEntity } from './entity.entity';
import { EntityTagsService } from './entity-tags.service';
import { EntityTagsController } from './entity-tags.controller';
import { EntityTag } from './entity-tag.entity';
import { RemovedEntitiesService } from './removed-entities.service';
import { RemovedEntitiesController } from './removed-entities.controller';
import { RemovedEntity } from './removed-entity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessEntity, EntityTag, RemovedEntity], 'org')],
  controllers: [EntitiesController, EntityTagsController, RemovedEntitiesController],
  providers: [EntitiesService, EntityTagsService, RemovedEntitiesService],
  exports: [EntitiesService, EntityTagsService, RemovedEntitiesService],
})
export class EntitiesModule {}
