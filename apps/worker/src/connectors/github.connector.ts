import axios from 'axios';
import { RawItem } from './rss.connector';

export async function fetchGithubAdvisories(
  url: string,
  headers?: Record<string, string>,
): Promise<RawItem[]> {
  const resp = await axios.get(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...headers,
    },
    timeout: 30000,
  });

  const data = Array.isArray(resp.data) ? resp.data : [];

  return data.map((advisory: any) => ({
    title: advisory.summary || advisory.ghsa_id || 'Untitled',
    summary: advisory.description?.slice(0, 500) || '',
    content: advisory.description || '',
    url: advisory.html_url || advisory.url || '',
    publishedAt: advisory.published_at || advisory.created_at,
    rawJson: advisory,
  }));
}
