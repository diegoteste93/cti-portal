import { Worker, Job } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { createHash } from 'crypto';
import { SourceType, QUEUE_NAMES, JOB_NAMES } from '@cti/shared';
import { fetchRss, fetchApi, fetchGithubAdvisories, fetchScrape, RawItem } from './connectors';
import { enrichItem } from './enrichment';

// We import entity classes dynamically via DataSource
let itemRepo: Repository<any>;
let sourceRepo: Repository<any>;

export function createIngestWorker(ds: DataSource, redisOpts: { host: string; port: number }) {
  // Get repositories from the loaded entities
  const itemMeta = ds.entityMetadatas.find((m) => m.tableName === 'items');
  const sourceMeta = ds.entityMetadatas.find((m) => m.tableName === 'sources');

  if (!itemMeta || !sourceMeta) {
    console.error('Could not find item or source entity metadata. Using raw queries.');
  }

  const worker = new Worker(
    QUEUE_NAMES.INGEST,
    async (job: Job) => {
      if (job.name === JOB_NAMES.FETCH_SOURCE) {
        await processSource(ds, job.data.sourceId);
      }
    },
    { connection: redisOpts, concurrency: 3 },
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed for source ${job.data.sourceId}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

async function processSource(ds: DataSource, sourceId: string) {
  // Fetch source config
  const sourceResult = await ds.query(
    `SELECT * FROM "sources" WHERE "id" = $1`,
    [sourceId],
  );
  if (!sourceResult.length) {
    throw new Error(`Source ${sourceId} not found`);
  }
  const source = sourceResult[0];

  console.log(`Processing source: ${source.name} (${source.type})`);

  // Fetch raw items based on connector type
  let rawItems: RawItem[] = [];
  const headers = source.headersJson || {};
  const mapping = source.mappingConfigJson || {};

  try {
    switch (source.type as SourceType) {
      case SourceType.RSS:
        rawItems = await fetchRss(source.url, headers);
        break;
      case SourceType.GENERIC_API:
        rawItems = await fetchApi(source.url, headers, mapping);
        break;
      case SourceType.GITHUB_RELEASES:
        rawItems = await fetchGithubAdvisories(source.url, headers);
        break;
      case SourceType.HTML_SCRAPE:
        rawItems = await fetchScrape(source.url, headers, mapping);
        break;
      default:
        throw new Error(`Unknown source type: ${source.type}`);
    }
  } catch (err: any) {
    console.error(`Failed to fetch from source ${source.name}:`, err.message);
    return;
  }

  console.log(`  Fetched ${rawItems.length} items from ${source.name}`);

  let inserted = 0;
  let duplicates = 0;

  for (const raw of rawItems) {
    try {
      // Generate dedup hash: canonical URL + hash(title + content)
      const hashInput = `${raw.url}|${raw.title}|${(raw.content || '').slice(0, 500)}`;
      const hash = createHash('sha256').update(hashInput).digest('hex');

      // Check for existing
      const existing = await ds.query(
        `SELECT "id" FROM "items" WHERE "hash" = $1`,
        [hash],
      );
      if (existing.length > 0) {
        duplicates++;
        continue;
      }

      // Enrich
      const enrichment = enrichItem(raw.title, raw.summary || '', raw.content || '');

      // Get source category IDs
      const sourceCats = await ds.query(
        `SELECT "categoriesId" FROM "source_categories" WHERE "sourcesId" = $1`,
        [sourceId],
      );
      const categoryIds = sourceCats.map((r: any) => r.categoriesId);

      // Insert item
      const result = await ds.query(
        `INSERT INTO "items" (
          "sourceId", "title", "summary", "content", "url",
          "publishedAt", "hash", "rawJson",
          "visibilityScope", "visibilityGroupIds",
          "cves", "cwes", "vendors", "products", "tags", "severity"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING "id"`,
        [
          sourceId,
          raw.title,
          raw.summary || null,
          raw.content || null,
          raw.url,
          raw.publishedAt ? new Date(raw.publishedAt) : null,
          hash,
          JSON.stringify(raw.rawJson),
          source.visibilityScope || 'public',
          source.visibilityGroupIds || '',
          enrichment.cves.join(','),
          enrichment.cwes.join(','),
          enrichment.vendors.join(','),
          enrichment.products.join(','),
          enrichment.tags.join(','),
          enrichment.severity || null,
        ],
      );

      // Link categories
      const itemId = result[0].id;
      for (const catId of categoryIds) {
        await ds.query(
          `INSERT INTO "item_categories" ("itemsId", "categoriesId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [itemId, catId],
        );
      }

      inserted++;
    } catch (err: any) {
      if (err.code === '23505') {
        duplicates++;
      } else {
        console.error(`  Error processing item "${raw.title}":`, err.message);
      }
    }
  }

  console.log(`  Source ${source.name}: ${inserted} new, ${duplicates} duplicates`);
}
