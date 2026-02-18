'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import SeverityBadge from '@/components/SeverityBadge';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';

type DateRange = '1h' | '24h' | '7d' | '30d' | 'custom';

interface DashboardStats {
  totalItems: number;
  itemsToday: number;
  itemsThisWeek: number;
  byCategoryCount?: Record<string, number>;
  topTagsCount?: Record<string, number>;
  recentItems?: Array<{
    id: string;
    title: string;
    severity?: string;
    source?: { name?: string };
  }>;
}

const rangeLabels: Record<DateRange, string> = {
  '1h': 'Last hour',
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  custom: 'Custom',
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedRange, setSelectedRange] = useState<DateRange>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    if (!user) return;

    if (selectedRange === 'custom' && (!customFrom || !customTo)) {
      setLoadingStats(false);
      setStats(null);
      return;
    }

    const params = new URLSearchParams();
    params.set('range', selectedRange);
    if (selectedRange === 'custom') {
      params.set('from', customFrom);
      params.set('to', customTo);
    }

    setLoadingStats(true);
    api
      .get(`/feed/dashboard?${params.toString()}`)
      .then((response) => setStats(response as DashboardStats))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [user, selectedRange, customFrom, customTo]);

  const topCategories = useMemo(() => {
    return Object.entries(stats?.byCategoryCount || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [stats]);

  const topTags = useMemo(() => {
    return Object.entries(stats?.topTagsCount || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [stats]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-gray-950">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Range</label>
              <select
                value={selectedRange}
                onChange={(e) => setSelectedRange(e.target.value as DateRange)}
                className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              >
                {Object.entries(rangeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {selectedRange === 'custom' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {loadingStats ? (
          <div className="text-gray-500">Loading dashboard data...</div>
        ) : !stats ? (
          <div className="text-red-500">Failed to load dashboard data.</div>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500">Total Items</p>
                <p className="mt-1 text-2xl font-bold">{stats.totalItems.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500">Items Today</p>
                <p className="mt-1 text-2xl font-bold">{stats.itemsToday.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-500">Items This Week</p>
                <p className="mt-1 text-2xl font-bold">{stats.itemsThisWeek.toLocaleString()}</p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 text-lg font-semibold">Top Categories</h3>
                <div className="space-y-2">
                  {(topCategories.length ? topCategories : [['none', 0]]).map(([name, count]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <Link href={`/feed?categories=${name}`} className="text-gray-700 hover:underline dark:text-gray-200">
                        {name}
                      </Link>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h3 className="mb-3 text-lg font-semibold">Top Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(topTags.length ? topTags : [['none', 0]]).map(([tag, count]) => (
                    <Link key={tag} href={`/feed?tags=${tag}`} className="badge badge-tag hover:opacity-80 transition-opacity">
                      {tag} ({count})
                    </Link>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Items</h3>
                <Link href="/feed" className="text-sm text-cyan-600 hover:underline dark:text-cyan-400">
                  Open full feed
                </Link>
              </div>
              <div className="space-y-2">
                {(stats.recentItems || []).slice(0, 8).map((item) => (
                  <Link
                    key={item.id}
                    href={`/feed/${item.id}`}
                    className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.source?.name || 'Unknown source'}</p>
                      </div>
                      <SeverityBadge severity={item.severity} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
