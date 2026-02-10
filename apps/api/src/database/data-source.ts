import { DataSource } from 'typeorm';
import * as path from 'path';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'cti',
  password: process.env.POSTGRES_PASSWORD || 'cti_secret_change_me',
  database: process.env.POSTGRES_DB || 'cti_portal',
  entities: [path.join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
