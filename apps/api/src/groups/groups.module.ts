import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group, GroupPolicy } from '../database/entities';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupPolicy]), AuditModule],
  providers: [GroupsService],
  controllers: [GroupsController],
  exports: [GroupsService],
})
export class GroupsModule {}
