import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SourcesService } from './sources.service';
import { CurrentUser, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@cti/shared';
import { User } from '../database/entities';

@Controller('sources')
@UseGuards(AuthGuard('jwt'))
export class SourcesController {
  constructor(private sourcesService: SourcesService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.sourcesService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sourcesService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CTI_EDITOR)
  create(@Body() body: any, @CurrentUser() actor: User) {
    return this.sourcesService.create(body, actor.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CTI_EDITOR)
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() actor: User) {
    return this.sourcesService.update(id, body, actor.id);
  }

  @Post(':id/fetch')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CTI_EDITOR)
  triggerFetch(@Param('id') id: string, @CurrentUser() actor: User) {
    return this.sourcesService.triggerFetch(id, actor.id);
  }
}
