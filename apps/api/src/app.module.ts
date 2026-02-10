import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { CategoriesModule } from './categories/categories.module';
import { SourcesModule } from './sources/sources.module';
import { ItemsModule } from './items/items.module';
import { FeedModule } from './feed/feed.module';
import { AuditModule } from './audit/audit.module';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: config.get('POSTGRES_HOST', 'localhost'),
        port: config.get<number>('POSTGRES_PORT', 5432),
        username: config.get('POSTGRES_USER', 'cti'),
        password: config.get('POSTGRES_PASSWORD', 'cti_secret_change_me'),
        database: config.get('POSTGRES_DB', 'cti_portal'),
        entities: [path.join(__dirname, 'database', 'entities', '*.entity.{ts,js}')],
        synchronize: false,
        logging: config.get('NODE_ENV') !== 'production',
      }),
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    AuthModule,
    UsersModule,
    GroupsModule,
    CategoriesModule,
    SourcesModule,
    ItemsModule,
    FeedModule,
    AuditModule,
  ],
})
export class AppModule {}
