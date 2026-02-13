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
  byCategoryCount?: Record<string, number>;
  topCves?: string[];
  topTags?: string[];
  topTagsCount?: Record<string, number>;
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

  useEffect(() => {
    if (!user) return;

    api
      .get('/feed/dashboard')
      .then((response) => setStats(response as DashboardStats))
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, [user]);

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

  const totalCategoryCount = categories.reduce((sum, category) => sum + category.count, 0);

  const avgDaily = Math.round((stats?.itemsThisWeek || 0) / 7);
  const areaA = buildAreaPath(timeline.seriesA, 640, 240);
  const areaB = buildAreaPath(timeline.seriesB, 640, 240);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-gray-950">
        <h2 className="mb-5 text-2xl font-bold">Dashboard</h2>

        {loadingStats ? (
          <div className="text-gray-500">Carregando estatísticas...</div>
        ) : stats ? (
          <div className="space-y-5">
            <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
              <KpiCard title="Total Itens" value={stats.totalItems.toLocaleString()} delta="4% desde a semana passada" />
              <KpiCard title="Média diária" value={avgDaily.toLocaleString()} delta="3% desde a semana passada" />
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
                  <h3 className="text-2xl font-semibold text-gray-700 dark:text-gray-100">Network Activities</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Visão geral do comportamento das ameaças por período.</p>
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
                    <path d={areaB} fill="rgba(22,163,74,0.35)" />
                    <path d={areaA} fill="rgba(14,116,144,0.45)" />
                  </svg>
                  <div className="mt-2 grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400">
                    {['Jan 01', 'Jan 02', 'Jan 03', 'Jan 04', 'Jan 05', 'Jan 06', 'Jan 07'].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-100">Top Campaign Performance</h4>
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
                <h4 className="mb-4 text-lg font-semibold">App Versions</h4>
                <p className="mb-4 text-sm text-gray-500">Distribuição de itens por categoria.</p>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const width = totalCategoryCount ? Math.round((category.count / totalCategoryCount) * 100) : 0;
                    return (
                      <div key={category.slug}>
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
                <h4 className="mb-4 text-lg font-semibold">Device Usage</h4>
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
                      const pct = totalCategoryCount
                        ? Math.round(((item as any).count / totalCategoryCount) * 100)
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
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h4 className="mb-4 text-lg font-semibold">Quick Settings</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>▣ Alertas de CVE críticos</li>
                  <li>▣ Assinatura de feeds priorizados</li>
                  <li>▣ Renovação automática</li>
                  <li>▣ Conquistas semanais</li>
                  <li>▣ Logout seguro</li>
                </ul>

                <div className="mt-6 rounded-lg border border-gray-200 p-3 text-center dark:border-gray-700">
                  <p className="text-sm font-medium">Profile Completion</p>
                  <div className="mx-auto mt-3 h-24 w-24 rounded-full border-[10px] border-gray-200 border-t-emerald-500 border-r-emerald-500 rotate-[20deg] dark:border-gray-700" />
                  <p className="mt-2 text-xs text-gray-500">$3,181 / $5,000</p>
                </div>
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
