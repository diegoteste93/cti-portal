'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import SeverityBadge from '@/components/SeverityBadge';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';

interface DashboardStats {
  totalItems: number;
  itemsToday: number;
  itemsThisWeek: number;
  rangeLabel?: string;
  byCategoryCount?: Record<string, number>;
  topCves?: string[];
  topTags?: string[];
  topTagsCount?: Record<string, number>;
  recentItems?: any[];
  brazilEvents?: {
    total: number;
    regions: Array<{ label: string; value: number; itemIds: string[] }>;
  };
}

type DateRange = '1h' | '24h' | '7d' | '30d' | 'custom';

const rangeLabels: Record<DateRange, string> = {
  '1h': 'Última hora',
  '24h': 'Últimas 24 horas',
  '7d': 'Última semana',
  '30d': 'Último mês',
  custom: 'Personalizado',
};

const categoryLabels: Record<string, string> = {
  vulnerability: 'Vulnerabilidades',
  exploit: 'Exploits e Ataques',
  ransomware: 'Ransomware',
  fraud: 'Fraude',
  data_leak: 'Vazamento de Dados',
  malware: 'Malware',
  phishing: 'Phishing',
  supply_chain: 'Supply Chain',
  general: 'Geral',
};

const categoryPalette: Record<string, string> = {
  vulnerability: '#ef4444',
  exploit: '#f97316',
  ransomware: '#a855f7',
  fraud: '#eab308',
  data_leak: '#ec4899',
  malware: '#dc2626',
  phishing: '#f59e0b',
  supply_chain: '#3b82f6',
  general: '#6b7280',
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
      setStats(null);
      setLoadingStats(false);
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
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, [user, selectedRange, customFrom, customTo]);

  const categories = useMemo(() => {
    return Object.entries(stats?.byCategoryCount || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, count]) => ({
        slug,
        count,
        label: categoryLabels[slug] || slug,
        color: categoryPalette[slug] || categoryPalette.general,
      }));
  }, [stats]);

  const totalCategoryCount = categories.reduce((sum, item) => sum + item.count, 0);

  let distributionGradient = 'none';
  if (categories.length > 0 && totalCategoryCount > 0) {
    let offset = 0;
    const segments = categories.map((category) => {
      const size = (category.count / totalCategoryCount) * 100;
      const start = offset;
      offset += size;
      return `${category.color} ${start}% ${offset}%`;
    });
    distributionGradient = `conic-gradient(${segments.join(', ')})`;
  }

  const topTags = Object.entries(stats?.topTagsCount || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const brazilTotal = stats?.brazilEvents?.total || 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-gray-950">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Período</label>
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
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">De</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-300">Até</label>
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

        {loading || loadingStats ? (
          <div className="text-gray-500">Carregando estatísticas...</div>
        ) : !stats ? (
          <div className="text-red-500">Falha ao carregar dados do dashboard.</div>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="card"><p className="text-xs text-gray-500">Total Itens</p><p className="text-2xl font-bold">{stats.totalItems}</p></div>
              <div className="card"><p className="text-xs text-gray-500">Itens Hoje</p><p className="text-2xl font-bold">{stats.itemsToday}</p></div>
              <div className="card"><p className="text-xs text-gray-500">Itens Semana</p><p className="text-2xl font-bold">{stats.itemsThisWeek}</p></div>
              <div className="card"><p className="text-xs text-gray-500">Brasil</p><p className="text-2xl font-bold">{brazilTotal}</p></div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="card xl:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Distribuição por Categoria</h3>
                  <span className="text-xs text-gray-400">Total: {totalCategoryCount} eventos</span>
                </div>
                <div className="space-y-3">
                  {(categories.length ? categories : [{ slug: 'general', label: 'Sem dados', count: 0, color: categoryPalette.general }]).map((item) => {
                    const pct = totalCategoryCount ? (item.count / totalCategoryCount) * 100 : 0;
                    return (
                      <div key={item.slug}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <Link href={`/feed?categories=${item.slug}`} className="text-gray-600 hover:text-cyan-600 hover:underline dark:text-gray-300 dark:hover:text-cyan-400">
                            {item.label}
                          </Link>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                          <div className="h-2 rounded-full" style={{ width: `${Math.max(pct, 3)}%`, backgroundColor: item.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card">
                <h3 className="mb-4 text-lg font-semibold">Visão Rápida</h3>
                <div className="flex items-center gap-4">
                  <div className="relative h-28 w-28 flex-shrink-0">
                    <div className="h-full w-full rounded-full" style={{ background: distributionGradient }} />
                    <div className="absolute inset-4 flex items-center justify-center rounded-full bg-white text-xs dark:bg-gray-900">Categorias</div>
                  </div>
                  <div className="space-y-1 text-sm">
                    {categories.map((item) => {
                      const pct = totalCategoryCount ? Math.round((item.count / totalCategoryCount) * 100) : 0;
                      return <div key={`pct-${item.slug}`}>{item.label}: {pct}%</div>;
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold">Recentes</h4>
                <Link href="/feed" className="text-sm text-cyan-600 hover:underline dark:text-cyan-400">Ver feed completo</Link>
              </div>
              <div className="space-y-2">
                {(stats.recentItems || []).slice(0, 6).map((item: any) => (
                  <Link key={item.id} href={`/feed/${item.id}`} className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.source?.name || 'Desconhecido'}</p>
                      </div>
                      <SeverityBadge severity={item.severity} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h4 className="mb-2 text-lg font-semibold">Top Tecnologias</h4>
              <div className="flex flex-wrap gap-2">
                {topTags.map(([tag, count]) => (
                  <Link key={tag} href={`/feed?tags=${tag}`} className="badge badge-tag hover:opacity-80 transition-opacity">
                    {tag} ({count})
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
