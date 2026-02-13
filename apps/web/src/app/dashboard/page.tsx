'use client';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import SeverityBadge from '@/components/SeverityBadge';
import { api } from '@/lib/api';
import Link from 'next/link';

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

interface BarChartProps {
  title: string;
  data: Record<string, number>;
  labels?: Record<string, string>;
  hrefBuilder: (key: string) => string;
  emptyMessage: string;
  barColorClass: string;
}

function InteractiveBarChart({
  title,
  data,
  labels = {},
  hrefBuilder,
  emptyMessage,
  barColorClass,
}: BarChartProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxValue = entries.length > 0 ? Math.max(...entries.map(([, value]) => value)) : 0;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([key, value]) => {
            const percentage = maxValue > 0 ? Math.max((value / maxValue) * 100, 4) : 0;
            const isHovered = hoveredKey === key;

            return (
              <Link
                key={key}
                href={hrefBuilder(key)}
                className="block rounded-lg border border-gray-800 bg-gray-900/50 p-2 hover:border-cti-accent transition-colors"
                onMouseEnter={() => setHoveredKey(key)}
                onMouseLeave={() => setHoveredKey((current) => (current === key ? null : current))}
              >
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="truncate pr-2">{labels[key] || key}</span>
                  <span className="font-mono font-semibold">{value}</span>
                </div>
                <div className="h-2 rounded bg-gray-800 overflow-hidden">
                  <div
                    className={`h-full rounded ${barColorClass} transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-80'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user) {
      api
        .get('/feed/dashboard')
        .then((response) => setStats(response as DashboardStats))
        .catch(console.error)
        .finally(() => setLoadingStats(false));
    }
  }, [user]);

  const categoryLabels: Record<string, string> = {
    vulnerability: 'Vulnerabilidades',
    exploit: 'Exploits e Ataques',
    ransomware: 'Ransomware',
    fraud: 'Fraude',
    data_leak: 'Vazamentos de Dados',
    malware: 'Malware',
    phishing: 'Phishing',
    supply_chain: 'Cadeia de Suprimentos',
    general: 'Geral',
  };

  const categorySummary = useMemo(() => {
    const entries = Object.entries(stats?.byCategoryCount || {});
    const total = entries.reduce((acc, [, count]) => acc + count, 0);
    const top = entries.sort((a, b) => b[1] - a[1])[0];

    if (!top || total === 0) return null;

    return {
      label: categoryLabels[top[0]] || top[0],
      count: top[1],
      percentage: Math.round((top[1] / total) * 100),
    };
  }, [stats]);

  const topTechSummary = useMemo(() => {
    const entries = Object.entries(stats?.topTagsCount || {});
    const total = entries.reduce((acc, [, count]) => acc + count, 0);
    const top = entries.sort((a, b) => b[1] - a[1])[0];

    if (!top || total === 0) return null;

    return {
      tag: top[0],
      count: top[1],
      percentage: Math.round((top[1] / total) * 100),
    };
  }, [stats]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

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
      <main className="flex-1 p-8 overflow-auto">
        <h2 className="text-2xl font-bold mb-6">Painel</h2>

        {loadingStats ? (
          <div className="text-gray-500">Carregando estatísticas...</div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total de Itens</p>
                <p className="text-3xl font-bold text-cti-accent">{stats.totalItems.toLocaleString()}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600 dark:text-gray-400">Hoje</p>
                <p className="text-3xl font-bold text-cti-green">{stats.itemsToday}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-600 dark:text-gray-400">Esta Semana</p>
                <p className="text-3xl font-bold text-cti-amber">{stats.itemsThisWeek}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <InteractiveBarChart
                  title="Categorias (interativo)"
                  data={stats.byCategoryCount || {}}
                  labels={categoryLabels}
                  hrefBuilder={(slug) => `/feed?categories=${slug}`}
                  emptyMessage="Sem dados de categorias ainda."
                  barColorClass="bg-gradient-to-r from-red-500 to-orange-500"
                />
                {categorySummary && (
                  <p className="text-xs text-gray-400">
                    Categoria líder: <span className="text-white font-medium">{categorySummary.label}</span> ({categorySummary.count} itens, {categorySummary.percentage}% do total).
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <InteractiveBarChart
                  title="Tecnologias (interativo)"
                  data={stats.topTagsCount || {}}
                  hrefBuilder={(tag) => `/feed?tags=${tag}`}
                  emptyMessage="Sem tags de tecnologia suficientes para exibir gráfico."
                  barColorClass="bg-gradient-to-r from-cyan-500 to-blue-500"
                />
                {topTechSummary && (
                  <p className="text-xs text-gray-400">
                    Tecnologia mais citada: <span className="text-white font-medium">{topTechSummary.tag}</span> ({topTechSummary.count} menções, {topTechSummary.percentage}% entre as top 10).
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {(stats.topCves || []).length > 0 && (
                <div className="card">
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
                <div className="card">
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
              )}
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Itens Recentes</h3>
                <Link href="/feed" className="text-sm text-cti-accent hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="space-y-3">
                {(stats.recentItems || []).map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/feed/${item.id}`}
                    className="block p-3 rounded-lg bg-white/75 hover:bg-white dark:bg-gray-800/45 dark:hover:bg-gray-800/70 transition-colors border border-gray-200/80 dark:border-gray-800/70 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.source?.name || 'Desconhecido'} &middot; {new Date(item.collectedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <SeverityBadge severity={item.severity} />
                        {item.categories?.map((c: any) => (
                          <span key={c.id} className="badge badge-category">
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
                {(stats.recentItems || []).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                    Nenhum item ainda. Configure fontes para começar a coletar dados de inteligência de ameaças.
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-red-400">Falha ao carregar dados do painel.</div>
        )}
      </main>
    </div>
  );
}
