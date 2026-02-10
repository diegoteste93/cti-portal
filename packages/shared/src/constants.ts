export const CVE_REGEX = /CVE-\d{4}-\d{4,}/gi;
export const CWE_REGEX = /CWE-\d{1,6}/gi;

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const QUEUE_NAMES = {
  INGEST: 'ingest',
  ENRICH: 'enrich',
  SCHEDULED_FETCH: 'scheduled-fetch',
} as const;

export const JOB_NAMES = {
  FETCH_SOURCE: 'fetch-source',
  NORMALIZE_ITEM: 'normalize-item',
  ENRICH_ITEM: 'enrich-item',
} as const;
