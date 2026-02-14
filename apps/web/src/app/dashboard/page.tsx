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
}

function buildAreaPath(points: number[], width: number, height: number) {
  if (!points.length) return '';
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);

  const mapped = points.map((point, idx) => {
    const x = (idx / (points.length - 1 || 1)) * width;
    const y = height - ((point - min) / range) * (height - 10) - 5;
    return { x, y };
  });

  const line = mapped.map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x},${point.y}`).join(' ');
  const area = `${line} L ${width},${height} L 0,${height} Z`;

  return area;
}

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

  const rangeLabels: Record<DateRange, string> = {
    '1h': 'Última hora',
    '24h': 'Últimas 24 horas',
    '7d': 'Última semana',
    '30d': 'Último mês',
    custom: 'Personalizado',
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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag, count]) => ({ tag, count }));
  }, [stats]);

  const categories = useMemo(() => {
    return Object.entries(stats?.byCategoryCount || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, count]) => ({ slug, count, label: categoryLabels[slug] || slug }));
  }, [stats]);

  const categoryCountTotal = categories.reduce((sum, category) => sum + category.count, 0);

  const recentItemsById = useMemo(() => {
    return new Map((stats?.recentItems || []).map((item: any) => [item.id, item]));
  }, [stats?.recentItems]);

  const chartMetrics = useMemo(() => ({
    avgDaily: Math.round((stats?.itemsThisWeek || 0) / 7),
    areaA: buildAreaPath(timeline.seriesA, 640, 240),
    areaB: buildAreaPath(timeline.seriesB, 640, 240),
  }), [stats?.itemsThisWeek, timeline.seriesA, timeline.seriesB]);

  const brazilEvents = stats?.brazilEvents || {
    total: 0,
    regions: [
      { label: 'Norte', value: 0, itemIds: [] },
      { label: 'Nordeste', value: 0, itemIds: [] },
      { label: 'Centro-Oeste', value: 0, itemIds: [] },
      { label: 'Sudeste', value: 0, itemIds: [] },
      { label: 'Sul', value: 0, itemIds: [] },
    ],
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

  const categories = Object.entries(stats?.byCategoryCount || {})
    .map(([slug, count]) => ({
      slug,
      label: categoryLabels[slug] || slug,
      count,
      color: categoryPalette[slug] || '#6b7280',
      cardColor: categoryColors[slug] || 'bg-gray-800 border-gray-700',
    }))
    .sort((a, b) => b.count - a.count);

  const totalCategoryCount = categories.reduce((sum, category) => sum + category.count, 0);

  const distributionGradient = categories.length
    ? (() => {
        let offset = 0;
        const segments = categories.map((category) => {
          const size = (category.count / totalCategoryCount) * 100;
          const start = offset;
          offset += size;
          return `${category.color} ${start}% ${offset}%`;
        });
        return `conic-gradient(${segments.join(', ')})`;
      })()
    : 'none';

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

        {selectedRange === 'custom' && (!customFrom || !customTo) ? (
          <div className="text-sm text-amber-600">Selecione data inicial e final para aplicar o filtro personalizado.</div>
        ) : loadingStats ? (
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
                  {stats.rangeLabel || 'Últimos 7 dias'}
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
                          <Link href={buildTagFeedHref(campaign.tag)} className="hover:text-cyan-600 hover:underline dark:hover:text-cyan-400">{campaign.tag}</Link>
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

            {/* Category breakdown */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
              <div className="card xl:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Distribuição por Categoria</h3>
                  <span className="text-xs text-gray-400">Total: {totalCategoryCount} eventos</span>
                </div>

                <div className="space-y-3">
                  {categories.map((category) => {
                    const percentage = totalCategoryCount ? (category.count / totalCategoryCount) * 100 : 0;
                    return (
                      <div key={category.slug} className={`rounded-lg border p-3 ${category.cardColor}`}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>{category.label}</span>
                          <span className="font-mono font-bold">{category.count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-900/70 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${Math.max(percentage, 3)}%`, backgroundColor: category.color }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {categories.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">Sem dados de categoria para exibir.</p>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Visão Rápida</h3>
                <div className="flex items-center gap-4">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <div
                      className="w-full h-full rounded-full"
                      style={{ background: distributionGradient }}
                    />
                    <div className="absolute inset-4 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center text-xs text-gray-300 text-center px-1">
                      Categorias
                    </div>
                  </div>
                  <div className="space-y-2 text-sm w-full">
                    {categories.slice(0, 4).map((category) => (
                      <div key={`legend-${category.slug}`} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="truncate">{category.label}</span>
                        </div>
                        <span className="font-mono text-gray-300">{category.count}</span>
                      </div>
                    ))}
                    {categories.length > 4 && (
                      <p className="text-xs text-gray-500">+{categories.length - 4} categorias adicionais</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 xl:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {(stats.topCves || []).length > 0 && (
                  <div className="card h-full">
                    <h3 className="text-lg font-semibold mb-3">CVEs em Destaque</h3>
                    <div className="flex flex-wrap gap-2">
                      {(stats.topCves || []).map((cve) => (
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

                {(stats.topTags || []).length > 0 && (
                  <div className="card h-full">
                    <h3 className="text-lg font-semibold mb-3">Principais Tecnologias</h3>
                    <div className="flex flex-wrap gap-2">
                      {(stats.topTags || []).map((tag) => (
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
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h4 className="mb-1 text-lg font-semibold">Eventos vinculados ao Brasil</h4>
                <p className="mb-3 text-sm text-gray-500">Clique no mapa para abrir o feed já filtrado com eventos relacionados ao Brasil.</p>

                <Link
                  href={brazilFeedHref}
                  aria-label="Abrir feed filtrado de eventos do Brasil"
                  className="group relative mx-auto block w-full max-w-[290px] rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-cyan-50 p-3 transition hover:border-emerald-300 hover:shadow-md dark:border-emerald-900/50 dark:from-gray-900 dark:to-gray-800 dark:hover:border-emerald-700"
                >
                  <svg viewBox="0 0 220 220" className="h-48 w-full" role="img" aria-label="Mapa do Brasil com total de eventos">
                    <path
                      d="M78 20 L118 18 L142 38 L165 40 L186 68 L178 96 L190 122 L171 147 L168 178 L138 194 L114 182 L90 195 L67 176 L45 160 L41 132 L27 112 L35 88 L52 73 L58 48 Z"
                      className="fill-emerald-500/85 stroke-emerald-700 dark:fill-emerald-600/75 dark:stroke-emerald-400"
                      strokeWidth="2"
                    />
                    <circle cx="112" cy="116" r="24" className="fill-white/95 stroke-emerald-700 dark:fill-gray-900 dark:stroke-emerald-300" strokeWidth="2" />
                    <text x="112" y="122" textAnchor="middle" className="fill-emerald-800 text-lg font-bold dark:fill-emerald-300">{brazilEvents.total}</text>
                  </svg>

                  <div className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:bg-gray-900/90 dark:text-emerald-300">
                    Ver no feed →
                  </div>
                </Link>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold">Recentes</h4>
                <Link href="/feed" className="text-sm text-cyan-600 hover:underline dark:text-cyan-400">
                  Ver feed completo
                </Link>
              </div>
              <div className="space-y-2">
                {(stats.recentItems || []).slice(0, 6).map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/feed/${item.id}`}
                    className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                  >
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
          </div>
        ) : (
          <div className="text-red-500">Falha ao carregar dados do dashboard.</div>
        )}
      </main>
    </div>
  );
}
