import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Source, Category } from '../database/entities';
import { SourcesService } from './sources.service';
import { SourcesController } from './sources.controller';
import { AuditModule } from '../audit/audit.module';
import { QUEUE_NAMES } from '@cti/shared';

@Module({
  imports: [
    TypeOrmModule.forFeature([Source, Category]),
    BullModule.registerQueue({ name: QUEUE_NAMES.INGEST }),
    AuditModule,
  ],
  providers: [SourcesService],
  controllers: [SourcesController],
  exports: [SourcesService],
})
export class SourcesModule {}
