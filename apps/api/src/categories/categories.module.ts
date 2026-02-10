import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../database/entities';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), AuditModule],
  providers: [CategoriesService],
  controllers: [CategoriesController],
  exports: [CategoriesService],
})
export class CategoriesModule {}
