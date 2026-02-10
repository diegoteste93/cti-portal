import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserPreference, Group } from '../database/entities';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserPreference, Group]), AuditModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
