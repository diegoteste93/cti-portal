import RssParser from 'rss-parser';

export interface RawItem {
  title: string;
  summary?: string;
  content?: string;
  url: string;
  publishedAt?: string;
  rawJson: Record<string, unknown>;
}

const parser = new RssParser();

export async function fetchRss(url: string, _headers?: Record<string, string>): Promise<RawItem[]> {
  const feed = await parser.parseURL(url);
  return (feed.items || []).map((item) => ({
    title: item.title || 'Untitled',
    summary: item.contentSnippet || item.content?.slice(0, 500),
    content: item.content || item['content:encoded'] || '',
    url: item.link || url,
    publishedAt: item.isoDate || item.pubDate,
    rawJson: item as Record<string, unknown>,
  }));
}
