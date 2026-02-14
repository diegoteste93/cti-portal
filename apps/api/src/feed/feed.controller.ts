import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedService } from './feed.service';
import { CurrentUser } from '../common/decorators';
import { User } from '../database/entities';

@Controller('feed')
@UseGuards(AuthGuard('jwt'))
export class FeedController {
  constructor(private feedService: FeedService) {}

  @Get()
  getPersonalizedFeed(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedService.getPersonalizedFeed(
      user,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('dashboard')
  getDashboardStats(
    @CurrentUser() user: User,
    @Query('range') range?: '1h' | '24h' | '7d' | '30d' | 'custom',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.feedService.getDashboardStats(user, range, from, to);
  }
}
