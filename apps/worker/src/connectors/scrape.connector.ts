import axios from 'axios';
import * as cheerio from 'cheerio';
import { RawItem } from './rss.connector';

export async function fetchScrape(
  url: string,
  headers?: Record<string, string>,
  mappingConfig?: Record<string, any>,
): Promise<RawItem[]> {
  const resp = await axios.get(url, {
    headers: { 'User-Agent': 'CTI-Portal/1.0 (Threat Intelligence Aggregator)', ...headers },
    timeout: 30000,
  });

  const $ = cheerio.load(resp.data);
  const items: RawItem[] = [];

  const itemSelector = mappingConfig?.itemSelector || 'article';
  const titleSelector = mappingConfig?.titleSelector || 'h2, h3, .title';
  const linkSelector = mappingConfig?.linkSelector || 'a';
  const summarySelector = mappingConfig?.summarySelector || 'p, .summary';

  $(itemSelector).each((_, el) => {
    const title = $(el).find(titleSelector).first().text().trim();
    const link = $(el).find(linkSelector).first().attr('href');
    const summary = $(el).find(summarySelector).first().text().trim();

    if (title && link) {
      const fullUrl = link.startsWith('http') ? link : new URL(link, url).toString();
      items.push({
        title,
        summary,
        content: summary,
        url: fullUrl,
        rawJson: { title, link: fullUrl, summary },
      });
    }
  });

  return items;
}
