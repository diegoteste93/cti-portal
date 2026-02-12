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
  byCategoryCount?: Record<string, number>;
  topCves?: string[];
  topTags?: string[];
  recentItems?: any[];
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

  if (loading || !user) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Carregando...</div></div>;

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
      <main className="flex-1 p-8 overflow-auto">
        <h2 className="text-2xl font-bold mb-6">Painel</h2>

        {loadingStats ? (
          <div className="text-gray-500">Carregando estatísticas...</div>
        ) : stats ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="card">
                <p className="text-sm text-gray-400">Total de Itens</p>
                <p className="text-3xl font-bold text-cti-accent">{stats.totalItems.toLocaleString()}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-400">Hoje</p>
                <p className="text-3xl font-bold text-cti-green">{stats.itemsToday}</p>
              </div>
              <div className="card">
                <p className="text-sm text-gray-400">Esta Semana</p>
                <p className="text-3xl font-bold text-cti-amber">{stats.itemsThisWeek}</p>
              </div>
            </div>

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
                )}
              </div>
            </div>

            {/* Recent items */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Itens Recentes</h3>
                <Link href="/feed" className="text-sm text-cti-accent hover:underline">Ver todos</Link>
              </div>
              <div className="space-y-3">
                {(stats.recentItems || []).map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/feed/${item.id}`}
                    className="block p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors border border-gray-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.source?.name || 'Desconhecido'} &middot; {new Date(item.collectedAt).toLocaleString()}
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
                {(stats.recentItems || []).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-8">
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
