import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GroupsService } from './groups.service';
import { CurrentUser, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@cti/shared';
import { User } from '../database/entities';

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Get()
  findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() body: any, @CurrentUser() actor: User) {
    return this.groupsService.create(body, actor.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() actor: User) {
    return this.groupsService.update(id, body, actor.id);
  }

  @Patch(':id/policy')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GROUP_MANAGER)
  updatePolicy(@Param('id') id: string, @Body() body: any, @CurrentUser() actor: User) {
    return this.groupsService.updatePolicy(id, body, actor.id);
  }
}
