import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@cti/shared';
import { User } from '../database/entities';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GROUP_MANAGER)
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('me/preferences')
  getMyPreferences(@CurrentUser() user: User) {
    return this.usersService.getPreferences(user.id);
  }

  @Patch('me/preferences')
  updateMyPreferences(@CurrentUser() user: User, @Body() body: any) {
    return this.usersService.updatePreferences(user.id, body);
  }

  @Patch('me/account')
  updateMyAccount(@CurrentUser() user: User, @Body() body: { name?: string; email?: string }) {
    return this.usersService.updateMyAccount(user.id, body || {});
  }

  @Patch('me/password')
  updateMyPassword(@CurrentUser() user: User, @Body() body: { currentPassword?: string; newPassword?: string }) {
    return this.usersService.updateMyPassword(user.id, body?.currentPassword || '', body?.newPassword || '');
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateRole(@Param('id') id: string, @Body('role') role: Role, @CurrentUser() actor: User) {
    return this.usersService.updateRole(id, role, actor.id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: any, @CurrentUser() actor: User) {
    return this.usersService.updateStatus(id, status, actor.id);
  }

  @Patch(':id/groups')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.GROUP_MANAGER)
  assignGroups(@Param('id') id: string, @Body('groupIds') groupIds: string[], @CurrentUser() actor: User) {
    return this.usersService.assignGroups(id, groupIds, actor.id);
  }
}
