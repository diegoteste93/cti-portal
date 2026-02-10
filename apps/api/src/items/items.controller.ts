import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ItemsService } from './items.service';
import { CurrentUser } from '../common/decorators';
import { User } from '../database/entities';

@Controller('items')
@UseGuards(AuthGuard('jwt'))
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Get()
  findAll(@Query() filters: any, @CurrentUser() user: User) {
    return this.itemsService.findAll(filters, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.itemsService.findById(id, user);
  }
}
