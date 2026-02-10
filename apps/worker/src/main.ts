import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import * as path from 'path';
import { QUEUE_NAMES } from '@cti/shared';
import { createIngestWorker } from './processor';
import { startScheduler } from './scheduler';

async function main() {
  console.log('CTI Portal Worker starting...');

  const redisOpts = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  };

  // Initialize database connection
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'cti',
    password: process.env.POSTGRES_PASSWORD || 'cti_secret_change_me',
    database: process.env.POSTGRES_DB || 'cti_portal',
    entities: [path.join(__dirname, '..', '..', 'api', 'src', 'database', 'entities', '*.entity.{ts,js}')],
    synchronize: false,
    logging: false,
  });

  await ds.initialize();
  console.log('Database connected');

  // Create BullMQ queue
  const ingestQueue = new Queue(QUEUE_NAMES.INGEST, { connection: redisOpts });

  // Start worker
  const worker = createIngestWorker(ds, redisOpts);
  console.log('Ingest worker started');

  // Start scheduler
  startScheduler(ds, ingestQueue);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    await worker.close();
    await ingestQueue.close();
    await ds.destroy();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
