import axios from 'axios';
import { RawItem } from './rss.connector';

export async function fetchApi(
  url: string,
  headers?: Record<string, string>,
  mappingConfig?: Record<string, any>,
): Promise<RawItem[]> {
  const resp = await axios.get(url, { headers, timeout: 30000 });
  let data = resp.data;

  // If data is wrapped, extract the array
  const arrayPath = mappingConfig?.arrayPath;
  if (arrayPath) {
    const parts = arrayPath.split('.');
    for (const part of parts) {
      data = data?.[part];
    }
  }

  if (!Array.isArray(data)) {
    data = [data];
  }

  const titleField = mappingConfig?.titleField || 'title';
  const summaryField = mappingConfig?.summaryField || 'summary';
  const contentField = mappingConfig?.contentField || 'description';
  const urlField = mappingConfig?.urlField || 'url';
  const dateField = mappingConfig?.dateField || 'published';

  return data.map((item: any) => ({
    title: getNestedValue(item, titleField) || 'Untitled',
    summary: getNestedValue(item, summaryField) || '',
    content: getNestedValue(item, contentField) || '',
    url: getNestedValue(item, urlField) || url,
    publishedAt: getNestedValue(item, dateField),
    rawJson: item,
  }));
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}
