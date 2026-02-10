'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import SeverityBadge from '@/components/SeverityBadge';
import { api } from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  totalItems: number;
  itemsToday: number;
  itemsThisWeek: number;
  byCategoryCount: Record<string, number>;
  topCves: string[];
  topTags: string[];
  recentItems: any[];
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      api.get<DashboardStats>('/feed/dashboard')
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoadingStats(false));
    }
  }, [user]);

  if (loading || !user) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Loading...</div></div>;

  const categoryLabels: Record<string, string> = {
    vulnerability: 'Vulnerabilities',
    exploit: 'Exploits & Attacks',
    ransomware: 'Ransomware',
    fraud: 'Fraud',
    data_leak: 'Data Leaks',
    malware: 'Malware',
    phishing: 'Phishing',
    supply_chain: 'Supply Chain',
    general: 'General',
  };

  const categoryColors: Record<string, string> = {
    vulnerability: 'bg-red-900/50 border-red-800',
    exploit: 'bg-orange-900/50 border-orange-800',
    ransomware: 'bg-purple-900/50 border-purple-800',
    fraud: 'bg-yellow-900/50 border-yellow-800',
    data_leak: 'bg-pink-900/50 border-pink-800',
    malware: 'bg-red-900/50 border-red-800',
    phishing: 'bg-amber-900/50 border-amber-800',
    supply_chain: 'bg-blue-900/50 border-blue-800',
    general: 'bg-gray-800/50 border-gray-700',
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

        {loadingStats ? (
          <div className="text-gray-500">Loading statistics...</div>
        ) : stats ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card">
                <p className="text-sm text-gray-400">Total Items</p>
                <p className="text-3xl font-bold text-cti-accent">{stats.totalItems.toLocaleString()}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-400">Today</p>
                <p className="text-3xl font-bold text-cti-green">{stats.itemsToday}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-400">This Week</p>
                <p className="text-3xl font-bold text-cti-amber">{stats.itemsThisWeek}</p>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">By Category</h3>
                <div className="space-y-2">
                  {Object.entries(stats.byCategoryCount).map(([slug, count]) => (
                    <div key={slug} className={`flex justify-between items-center p-2 rounded border ${categoryColors[slug] || 'bg-gray-800 border-gray-700'}`}>
                      <span className="text-sm">{categoryLabels[slug] || slug}</span>
                      <span className="font-mono font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {stats.topCves.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-3">Trending CVEs</h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.topCves.map((cve) => (
                        <Link
                          key={cve}
                          href={`/feed?cve=${cve}`}
                          className="badge badge-critical hover:opacity-80 transition-opacity"
                        >
                          {cve}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {stats.topTags.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-3">Top Technologies</h3>
                    <div className="flex flex-wrap gap-2">
                      {stats.topTags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/feed?tags=${tag}`}
                          className="badge badge-tag hover:opacity-80 transition-opacity"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent items */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Recent Items</h3>
                <Link href="/feed" className="text-sm text-cti-accent hover:underline">View all</Link>
              </div>
              <div className="space-y-3">
                {stats.recentItems.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/feed/${item.id}`}
                    className="block p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.source?.name || 'Unknown'} &middot; {new Date(item.collectedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <SeverityBadge severity={item.severity} />
                        {item.categories?.map((c: any) => (
                          <span key={c.id} className="badge badge-category">{c.name}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
                {stats.recentItems.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No items yet. Configure sources to start ingesting threat intelligence data.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-red-400">Failed to load dashboard data.</div>
        )}
      </main>
    </div>
  );
}
