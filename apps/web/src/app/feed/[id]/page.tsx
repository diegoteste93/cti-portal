'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import SeverityBadge from '@/components/SeverityBadge';
import { api } from '@/lib/api';
import Link from 'next/link';

interface ItemDetail {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  publishedAt?: string;
  collectedAt: string;
  severity?: string;
  cves: string;
  cwes: string;
  tags: string;
  vendors: string;
  products: string;
  source?: { id: string; name: string };
  categories: { id: string; name: string; slug: string }[];
  rawJson?: any;
}

export default function ItemDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && params.id) {
      api.get<ItemDetail>(`/items/${params.id}`)
        .then(setItem)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [user, params.id]);

  if (authLoading || !user) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-500">Carregando...</div></div>;

  const splitField = (val: string | undefined) => val ? val.split(',').filter(Boolean) : [];

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <button onClick={() => router.back()} className="text-sm text-cti-accent hover:underline mb-4">
          &larr; Voltar ao Feed
        </button>

        {loading ? (
          <div className="text-gray-500">Carregando...</div>
        ) : error ? (
          <div className="card border-red-800">
            <p className="text-red-400">{error}</p>
          </div>
        ) : item ? (
          <div className="max-w-4xl">
            <div className="card mb-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-2xl font-bold">{item.title}</h1>
                <SeverityBadge severity={item.severity} />
              </div>

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
                <span>Fonte: <strong>{item.source?.name || 'Desconhecido'}</strong></span>
                <span>Coletado: {new Date(item.collectedAt).toLocaleString()}</span>
                {item.publishedAt && <span>Publicado: {new Date(item.publishedAt).toLocaleString()}</span>}
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-cti-accent hover:underline">
                  Original &rarr;
                </a>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 mb-4">
                {item.categories.map((c) => (
                  <span key={c.id} className="badge badge-category">{c.name}</span>
                ))}
              </div>

              {/* Summary */}
              {item.summary && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">Resumo</h3>
                  <p className="text-gray-300">{item.summary}</p>
                </div>
              )}

              {/* Content */}
              {item.content && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-1">Conteúdo</h3>
                  <div className="prose prose-invert max-w-none text-sm text-gray-300 whitespace-pre-wrap">
                    {item.content}
                  </div>
                </div>
              )}
            </div>

            {/* Enrichment data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {splitField(item.cves).length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">CVEs</h3>
                  <div className="flex flex-wrap gap-2">
                    {splitField(item.cves).map((cve) => (
                      <a
                        key={cve}
                        href={`https://nvd.nist.gov/vuln/detail/${cve}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="badge badge-critical hover:opacity-80"
                      >
                        {cve}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {splitField(item.cwes).length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">CWEs</h3>
                  <div className="flex flex-wrap gap-2">
                    {splitField(item.cwes).map((cwe) => (
                      <span key={cwe} className="badge bg-amber-900 text-amber-200">{cwe}</span>
                    ))}
                  </div>
                </div>
              )}

              {splitField(item.tags).length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Tecnologias</h3>
                  <div className="flex flex-wrap gap-2">
                    {splitField(item.tags).map((tag) => (
                      <Link key={tag} href={`/feed?tags=${tag}`} className="badge badge-tag hover:opacity-80">{tag}</Link>
                    ))}
                  </div>
                </div>
              )}

              {(splitField(item.vendors).length > 0 || splitField(item.products).length > 0) && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Fornecedores e Produtos</h3>
                  <div className="flex flex-wrap gap-2">
                    {splitField(item.vendors).map((v) => (
                      <span key={v} className="badge bg-indigo-900 text-indigo-200">{v}</span>
                    ))}
                    {splitField(item.products).map((p) => (
                      <span key={p} className="badge bg-teal-900 text-teal-200">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
