'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import SeverityBadge from '@/components/SeverityBadge';
import { api } from '@/lib/api';
import Link from 'next/link';

interface FeedItem {
  id: string;
  title: string;
  summary?: string;
  url: string;
  collectedAt: string;
  publishedAt?: string;
  severity?: string;
  cves: string;
  tags: string;
  source?: { name: string };
  categories: { id: string; name: string; slug: string }[];
}

interface FeedResponse {
  data: FeedItem[];
  total: number;
  page: number;
  totalPages: number;
}

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('categories') || '');
  const [tag, setTag] = useState(searchParams.get('tags') || '');
  const [cve, setCve] = useState(searchParams.get('cve') || '');
  const [severity, setSeverity] = useState(searchParams.get('severity') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [usePersonalized, setUsePersonalized] = useState(true);
  const [categories, setCategories] = useState<{id: string; name: string; slug: string}[]>([]);

  useEffect(() => {
    if (user) {
      api.get<any[]>('/categories').then(setCategories).catch(console.error);
    }
  }, [user]);

  const fetchItems = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('categories', category);
      if (tag) params.set('tags', tag);
      if (cve) params.set('cve', cve);
      if (severity) params.set('severity', severity);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      params.set('page', String(p));
      params.set('limit', '20');

      const endpoint = usePersonalized && !search && !category && !tag && !cve && !severity
        ? '/feed'
        : '/items';

      const res = await api.get<FeedResponse>(`${endpoint}?${params.toString()}`);
      setItems(res.data);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, tag, cve, severity, dateFrom, dateTo, usePersonalized]);

  useEffect(() => {
    if (user) fetchItems();
  }, [user, fetchItems]);

  if (authLoading || !user) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Loading...</div></div>;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems(1);
  };

  const clearFilters = () => {
    setSearch(''); setCategory(''); setTag(''); setCve(''); setSeverity('');
    setDateFrom(''); setDateTo('');
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto">
        {/* Filters bar */}
        <div className="sticky top-0 z-10 bg-gray-950 border-b border-gray-800 p-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items... (full-text, AND/OR, CVE, keywords)"
                className="input-field flex-1"
              />
              <button type="submit" className="btn-primary">Search</button>
              <button type="button" onClick={clearFilters} className="btn-secondary">Clear</button>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <select value={category} onChange={(e) => { setCategory(e.target.value); }} className="input-field w-auto">
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>

              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input-field w-auto">
                <option value="">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Technology tag..."
                className="input-field w-40"
              />

              <input
                type="text"
                value={cve}
                onChange={(e) => setCve(e.target.value)}
                placeholder="CVE-YYYY-NNNN"
                className="input-field w-40"
              />

              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-auto" />
              <span className="text-gray-500">to</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-auto" />

              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input
                  type="checkbox"
                  checked={usePersonalized}
                  onChange={(e) => setUsePersonalized(e.target.checked)}
                  className="rounded"
                />
                Personalized Feed
              </label>
            </div>
          </form>

          <div className="mt-2 text-xs text-gray-500">
            {total} results {search && `for "${search}"`}
          </div>
        </div>

        {/* Results */}
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No items found</p>
              <p className="text-gray-600 text-sm mt-2">Try adjusting your filters or add more sources.</p>
            </div>
          ) : (
            items.map((item) => (
              <Link
                key={item.id}
                href={`/feed/${item.id}`}
                className="block card hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-100 mb-1">{item.title}</h3>
                    {item.summary && (
                      <p className="text-sm text-gray-400 line-clamp-2">{item.summary}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">{item.source?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-600">{new Date(item.collectedAt).toLocaleString()}</span>
                      {item.cves && item.cves.split(',').filter(Boolean).map((cve) => (
                        <span key={cve} className="badge badge-critical text-[10px]">{cve}</span>
                      ))}
                      {item.tags && item.tags.split(',').filter(Boolean).slice(0, 5).map((tag) => (
                        <span key={tag} className="badge badge-tag text-[10px]">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <SeverityBadge severity={item.severity} />
                    {item.categories?.map((c) => (
                      <span key={c.id} className="badge badge-category text-[10px]">{c.name}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 py-4">
              <button
                onClick={() => fetchItems(page - 1)}
                disabled={page <= 1}
                className="btn-secondary text-sm disabled:opacity-30"
              >
                Previous
              </button>
              <span className="flex items-center text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => fetchItems(page + 1)}
                disabled={page >= totalPages}
                className="btn-secondary text-sm disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
