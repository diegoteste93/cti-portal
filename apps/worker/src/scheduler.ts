import * as cron from 'node-cron';
import { Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { QUEUE_NAMES, JOB_NAMES } from '@cti/shared';

export function startScheduler(ds: DataSource, ingestQueue: Queue) {
  // Check every minute for sources that need to run
  cron.schedule('* * * * *', async () => {
    try {
      const sources = await ds.query(
        `SELECT "id", "name", "scheduleCron" FROM "sources" WHERE "enabled" = true`,
      );

      const now = new Date();

      for (const source of sources) {
        if (source.scheduleCron && cron.validate(source.scheduleCron)) {
          // Check if this cron should fire now (simple minute-level check)
          const task = cron.schedule(source.scheduleCron, () => {}, { scheduled: false });
          // Use a simpler approach: schedule each source with BullMQ repeatable
        }
      }
    } catch (err: any) {
      console.error('Scheduler tick error:', err.message);
    }
  });

  // On startup: schedule all enabled sources as BullMQ repeatable jobs
  scheduleAllSources(ds, ingestQueue).catch(console.error);

  console.log('Scheduler started');
}

async function scheduleAllSources(ds: DataSource, ingestQueue: Queue) {
  const sources = await ds.query(
    `SELECT "id", "name", "scheduleCron" FROM "sources" WHERE "enabled" = true`,
  );

  // Remove existing repeatable jobs
  const existing = await ingestQueue.getRepeatableJobs();
  for (const job of existing) {
    await ingestQueue.removeRepeatableByKey(job.key);
  }

  for (const source of sources) {
    if (source.scheduleCron && cron.validate(source.scheduleCron)) {
      await ingestQueue.add(
        JOB_NAMES.FETCH_SOURCE,
        { sourceId: source.id },
        {
          repeat: { pattern: source.scheduleCron },
          jobId: `scheduled-${source.id}`,
        },
      );
      console.log(`  Scheduled source: ${source.name} (${source.scheduleCron})`);
    }
  }

  console.log(`Scheduled ${sources.length} sources`);
}
