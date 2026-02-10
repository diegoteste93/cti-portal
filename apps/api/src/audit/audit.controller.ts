import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '@cti/shared';

@Controller('audit')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.auditService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
