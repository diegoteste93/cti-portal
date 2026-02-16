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
<<<<<<< codex/fix-merge-conflict-in-dashboard/page.tsx-q9s0ms
  recentItems?: Array<{
    id: string;
    title: string;
    severity?: string;
    source?: { name?: string };
  }>;
=======
  recentItems?: any[];
}

interface KpiCardProps {
  title: string;
  value: string;
  delta: string;
  positive?: boolean;
}

function KpiCard({ title, value, delta, positive = true }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</p>
      <p className="mt-1 text-3xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className={`mt-1 text-xs font-medium ${positive ? 'text-emerald-600' : 'text-rose-500'}`}>
        {positive ? '▲' : '▼'} {delta}
      </p>
    </div>
  );
>>>>>>> prd
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

  useEffect(() => {
    if (!user) return;

<<<<<<< codex/fix-merge-conflict-in-dashboard/page.tsx-q9s0ms
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
=======
>>>>>>> prd
    api
      .get('/feed/dashboard')
      .then((response) => setStats(response as DashboardStats))
      .catch(() => setStats(null))
      .finally(() => setLoadingStats(false));
  }, [user]);

<<<<<<< codex/fix-merge-conflict-in-dashboard/page.tsx-q9s0ms
  const topCategories = useMemo(() => {
    return Object.entries(stats?.byCategoryCount || {})
=======
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

  const timeline = useMemo(() => {
    const base = stats?.itemsThisWeek || 0;
    const today = stats?.itemsToday || 0;
    const catTotal = Object.values(stats?.byCategoryCount || {}).reduce((sum, value) => sum + value, 0);

    const seriesA = Array.from({ length: 7 }, (_, idx) => {
      const wave = Math.sin((idx + 1) * 1.1) * 12 + Math.cos((idx + 2) * 0.7) * 9;
      return Math.max(6, Math.round(base / 7 + wave + today * 0.45));
    });

    const seriesB = Array.from({ length: 7 }, (_, idx) => {
      const wave = Math.cos((idx + 1) * 0.9) * 10 + Math.sin((idx + 1) * 1.4) * 7;
      return Math.max(4, Math.round(base / 8 + wave + catTotal * 0.05));
    });

    return { seriesA, seriesB };
  }, [stats]);

  const topCampaigns = useMemo(() => {
    return Object.entries(stats?.topTagsCount || {})
>>>>>>> prd
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [stats]);

  const topTags = useMemo(() => {
    return Object.entries(stats?.topTagsCount || {})
      .sort((a, b) => b[1] - a[1])
<<<<<<< codex/fix-merge-conflict-in-dashboard/page.tsx-q9s0ms
      .slice(0, 8);
  }, [stats]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
=======
      .slice(0, 5)
      .map(([slug, count]) => ({
        slug,
        count,
        label: categoryLabels[slug] || slug,
        color: categoryPalette[slug] || categoryPalette.general,
      }));
  }, [stats]);

  const categoryCountTotal = categories.reduce((sum, category) => sum + category.count, 0);

  const chartMetrics = useMemo(() => ({
    avgDaily: Math.round((stats?.itemsThisWeek || 0) / 7),
    areaA: buildAreaPath(timeline.seriesA, 640, 240),
    areaB: buildAreaPath(timeline.seriesB, 640, 240),
  }), [stats?.itemsThisWeek, timeline.seriesA, timeline.seriesB]);

  const brazilEvents = useMemo(() => {
    const base = stats?.itemsThisWeek || 0;
    const critical = stats?.byCategoryCount?.vulnerability || 0;
    const ransomware = stats?.byCategoryCount?.ransomware || 0;
    const phishing = stats?.byCategoryCount?.phishing || 0;

    const total = Math.max(Math.round(base * 0.28), 0);

    return {
      total,
      regions: [
        { label: 'Norte', value: Math.max(Math.round(total * 0.11), 1) },
        { label: 'Nordeste', value: Math.max(Math.round(total * 0.23), 1) },
        { label: 'Centro-Oeste', value: Math.max(Math.round(total * 0.16), 1) },
        { label: 'Sudeste', value: Math.max(Math.round(total * 0.34 + critical * 0.02), 1) },
        { label: 'Sul', value: Math.max(Math.round(total * 0.16 + ransomware * 0.01 + phishing * 0.01), 1) },
      ],
    };
  }, [stats]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
>>>>>>> prd
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-gray-950">
<<<<<<< codex/fix-merge-conflict-in-dashboard/page.tsx-q9s0ms
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
=======
        <h2 className="mb-5 text-2xl font-bold">Dashboard</h2>

        {loadingStats ? (
          <div className="text-gray-500">Carregando estatísticas...</div>
        ) : stats ? (
          <div className="space-y-5">
            <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
              <KpiCard title="Total Itens" value={stats.totalItems.toLocaleString()} delta="4% desde a semana passada" />
              <KpiCard title="Média diária" value={chartMetrics.avgDaily.toLocaleString()} delta="3% desde a semana passada" />
              <KpiCard
                title="Vulnerabilidades"
                value={(stats.byCategoryCount?.vulnerability || 0).toLocaleString()}
                delta="34% desde a semana passada"
              />
              <KpiCard
                title="Ransomware"
                value={(stats.byCategoryCount?.ransomware || 0).toLocaleString()}
                delta="12% desde a semana passada"
                positive={false}
              />
              <KpiCard title="Itens hoje" value={stats.itemsToday.toLocaleString()} delta="34% desde a semana passada" />
              <KpiCard title="Itens na semana" value={stats.itemsThisWeek.toLocaleString()} delta="34% desde a semana passada" />
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-100">Atividade de ameaças</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Volume de eventos coletados e correlação por tendência diária.</p>
                </div>
                <span className="rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  Últimos 7 dias
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-lg border border-gray-100 bg-gradient-to-b from-cyan-50 to-white p-3 dark:border-gray-800 dark:from-gray-900 dark:to-gray-900">
                  <svg viewBox="0 0 640 240" className="h-[240px] w-full" role="img" aria-label="Atividade da rede">
                    {Array.from({ length: 7 }).map((_, idx) => (
                      <line
                        key={`line-${idx}`}
                        x1={(idx / 6) * 640}
                        x2={(idx / 6) * 640}
                        y1="0"
                        y2="240"
                        className="stroke-gray-200 dark:stroke-gray-800"
                        strokeWidth="1"
                      />
                    ))}
                    <path d={chartMetrics.areaB} fill="rgba(22,163,74,0.35)" />
                    <path d={chartMetrics.areaA} fill="rgba(14,116,144,0.45)" />
                  </svg>
                  <div className="mt-2 grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400">
                    {['Jan 01', 'Jan 02', 'Jan 03', 'Jan 04', 'Jan 05', 'Jan 06', 'Jan 07'].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-100">Tecnologias/temas em evidência</h4>
                  {(topCampaigns.length ? topCampaigns : [{ tag: 'Sem dados', count: 1 }]).map((campaign, idx) => {
                    const max = Math.max(topCampaigns[0]?.count || 1, 1);
                    const percent = Math.max(Math.round((campaign.count / max) * 100), 10);

                    return (
                      <div key={`${campaign.tag}-${idx}`}>
                        <div className="mb-1 flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                          <span>{campaign.tag}</span>
                          <span className="font-semibold">{campaign.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800">
                          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h4 className="mb-4 text-lg font-semibold">Categorias mais monitoradas</h4>
                <p className="mb-4 text-sm text-gray-500">Participação das principais categorias no período.</p>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const width = categoryCountTotal ? Math.round((category.count / categoryCountTotal) * 100) : 0;
                    return (
                      <div key={item.slug}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">{category.label}</span>
                          <span className="font-semibold">{category.count}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800">
                          <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${Math.max(width, 8)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  {categories.length === 0 && <p className="text-sm text-gray-500">Sem categorias para exibir.</p>}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h4 className="mb-4 text-lg font-semibold">Distribuição percentual por categoria</h4>
                <div className="flex items-center gap-4">
                  <div
                    className="h-36 w-36 rounded-full"
                    style={{
                      background:
                        categories.length > 0
                          ? `conic-gradient(#0ea5e9 0% 35%, #14b8a6 35% 60%, #8b5cf6 60% 75%, #94a3b8 75% 90%, #ef4444 90% 100%)`
                          : '#e5e7eb',
                    }}
                  >
                    <div className="m-7 h-22 w-22 rounded-full bg-white dark:bg-gray-900" />
                  </div>
                  <div className="space-y-2 text-sm">
                    {(categories.length ? categories : [{ label: 'Sem dados', count: 0 }]).map((item, index) => {
                      const colors = ['bg-sky-500', 'bg-teal-500', 'bg-violet-500', 'bg-slate-400', 'bg-red-500'];
                      const pct = categoryCountTotal
                        ? Math.round(((item as any).count / categoryCountTotal) * 100)
                        : 0;
                      return (
                        <div key={`${item.label}-${index}`} className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${colors[index] || 'bg-gray-500'}`} />
                          <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                          <span className="font-semibold">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
>>>>>>> prd
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
<<<<<<< codex/fix-merge-conflict-in-dashboard/page.tsx-q9s0ms
                <h3 className="mb-3 text-lg font-semibold">Top Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {(topTags.length ? topTags : [['none', 0]]).map(([tag, count]) => (
                    <Link key={tag} href={`/feed?tags=${tag}`} className="badge badge-tag hover:opacity-80 transition-opacity">
                      {tag} ({count})
                    </Link>
=======
                <h4 className="mb-1 text-lg font-semibold">Eventos vinculados ao Brasil</h4>
                <p className="mb-4 text-sm text-gray-500">Estimativa de incidentes com contexto nacional (últimos 7 dias).</p>

                <div className="relative mx-auto w-full max-w-[270px] rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-3 dark:border-emerald-900/50 dark:from-gray-900 dark:to-gray-800">
                  <svg viewBox="0 0 220 220" className="h-48 w-full" role="img" aria-label="Mapa estilizado do Brasil com eventos">
                    <path
                      d="M78 20 L118 18 L142 38 L165 40 L186 68 L178 96 L190 122 L171 147 L168 178 L138 194 L114 182 L90 195 L67 176 L45 160 L41 132 L27 112 L35 88 L52 73 L58 48 Z"
                      className="fill-emerald-500/80 stroke-emerald-700 dark:fill-emerald-600/70 dark:stroke-emerald-400"
                      strokeWidth="2"
                    />
                    <circle cx="106" cy="54" r="13" className="fill-white/90 stroke-emerald-700 dark:fill-gray-900 dark:stroke-emerald-300" strokeWidth="2" />
                    <text x="106" y="58" textAnchor="middle" className="fill-emerald-800 text-[10px] font-bold dark:fill-emerald-300">{brazilEvents.regions[0].value}</text>

                    <circle cx="143" cy="84" r="14" className="fill-white/90 stroke-emerald-700 dark:fill-gray-900 dark:stroke-emerald-300" strokeWidth="2" />
                    <text x="143" y="88" textAnchor="middle" className="fill-emerald-800 text-[10px] font-bold dark:fill-emerald-300">{brazilEvents.regions[1].value}</text>

                    <circle cx="108" cy="112" r="14" className="fill-white/90 stroke-emerald-700 dark:fill-gray-900 dark:stroke-emerald-300" strokeWidth="2" />
                    <text x="108" y="116" textAnchor="middle" className="fill-emerald-800 text-[10px] font-bold dark:fill-emerald-300">{brazilEvents.regions[2].value}</text>

                    <circle cx="118" cy="146" r="16" className="fill-white/90 stroke-emerald-700 dark:fill-gray-900 dark:stroke-emerald-300" strokeWidth="2" />
                    <text x="118" y="150" textAnchor="middle" className="fill-emerald-800 text-[10px] font-bold dark:fill-emerald-300">{brazilEvents.regions[3].value}</text>

                    <circle cx="88" cy="170" r="13" className="fill-white/90 stroke-emerald-700 dark:fill-gray-900 dark:stroke-emerald-300" strokeWidth="2" />
                    <text x="88" y="174" textAnchor="middle" className="fill-emerald-800 text-[10px] font-bold dark:fill-emerald-300">{brazilEvents.regions[4].value}</text>
                  </svg>

                  <div className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:bg-gray-900/90 dark:text-emerald-300">
                    Total BR: {brazilEvents.total}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  {brazilEvents.regions.map((region) => (
                    <div key={region.label} className="rounded-md border border-gray-200 px-2 py-1 dark:border-gray-700">
                      <span className="font-medium">{region.label}:</span> {region.value}
                    </div>
>>>>>>> prd
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
<<<<<<< codex/fix-merge-conflict-in-dashboard/page.tsx-q9s0ms
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
=======
                <h4 className="text-lg font-semibold">Recentes</h4>
                <Link href="/feed" className="text-sm text-cyan-600 hover:underline dark:text-cyan-400">Ver feed completo</Link>
              </div>
              <div className="space-y-2">
                {(stats.recentItems || []).slice(0, 6).map((item: any) => (
                  <Link key={item.id} href={`/feed/${item.id}`} className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50">
>>>>>>> prd
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
