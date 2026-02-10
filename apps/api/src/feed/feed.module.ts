import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Item, User, UserPreference, GroupPolicy, Category } from '../database/entities';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Item, User, UserPreference, GroupPolicy, Category])],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
