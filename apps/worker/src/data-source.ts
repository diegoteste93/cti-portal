import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as path from 'path';

export const WorkerDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'cti',
  password: process.env.POSTGRES_PASSWORD || 'cti_secret_change_me',
  database: process.env.POSTGRES_DB || 'cti_portal',
  entities: [path.join(__dirname, '..', '..', 'api', 'src', 'database', 'entities', '*.entity.{ts,js}')],
  synchronize: false,
});
