import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, Category } from '../database/entities';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Item, Category])],
  providers: [ItemsService],
  controllers: [ItemsController],
  exports: [ItemsService],
})
export class ItemsModule {}
