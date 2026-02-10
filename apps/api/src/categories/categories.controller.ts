import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';
import { CurrentUser, Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@cti/shared';
import { User } from '../database/entities';

@Controller('categories')
@UseGuards(AuthGuard('jwt'))
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CTI_EDITOR)
  create(@Body() body: any, @CurrentUser() actor: User) {
    return this.categoriesService.create(body, actor.id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.CTI_EDITOR)
  update(@Param('id') id: string, @Body() body: any, @CurrentUser() actor: User) {
    return this.categoriesService.update(id, body, actor.id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string, @CurrentUser() actor: User) {
    return this.categoriesService.delete(id, actor.id);
  }
}
