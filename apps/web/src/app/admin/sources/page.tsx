'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { isAdmin, isEditor } from '@/lib/auth';

interface Source {
  id: string;
  name: string;
  type: string;
  url: string;
  scheduleCron: string;
  enabled: boolean;
  categories: { id: string; name: string }[];
  createdAt: string;
}

export default function SourcesPage() {
  const { user, loading: authLoading } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'rss', url: '', scheduleCron: '0 */4 * * *', categoryIds: [] as string[] });
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.get<any>('/sources').then((r) => { setSources(r.data); setTotal(r.total); }),
        api.get<any[]>('/categories').then(setCategories),
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/sources', form);
      const r = await api.get<any>('/sources');
      setSources(r.data);
      setTotal(r.total);
      setShowForm(false);
      setForm({ name: '', type: 'rss', url: '', scheduleCron: '0 */4 * * *', categoryIds: [] });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await api.patch(`/sources/${id}`, { enabled: !enabled });
    setSources((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !enabled } : s));
  };

  const handleFetch = async (id: string) => {
    await api.post(`/sources/${id}/fetch`);
    alert('Coleta enfileirada com sucesso');
  };

  if (authLoading || !user) return null;
  if (!isAdmin(user) && !isEditor(user)) return <div className="p-8 text-red-400">Acesso negado</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Fontes ({total})</h2>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancelar' : '+ Adicionar Fonte'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="input-field">
                  <option value="rss">RSS</option>
                  <option value="generic_api">API Genérica (JSON)</option>
                  <option value="github_releases">GitHub Advisory</option>
                  <option value="html_scrape">Raspador HTML</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL</label>
                <input value={form.url} onChange={(e) => setForm({...form, url: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Agendamento (cron)</label>
                <input value={form.scheduleCron} onChange={(e) => setForm({...form, scheduleCron: e.target.value})} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Categorias</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(c.id)}
                      onChange={(e) => {
                        if (e.target.checked) setForm({...form, categoryIds: [...form.categoryIds, c.id]});
                        else setForm({...form, categoryIds: form.categoryIds.filter((id) => id !== c.id)});
                      }}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Criar Fonte'}</button>
          </form>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="text-gray-500">Carregando...</div>
          ) : sources.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">Nenhuma fonte configurada ainda.</div>
          ) : (
            sources.map((source) => (
              <div key={source.id} className="card flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                    <h3 className="font-semibold">{source.name}</h3>
                    <span className="badge bg-gray-700 text-gray-300">{source.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{source.url}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-gray-600">Cron: {source.scheduleCron}</span>
                    {source.categories.map((c) => (
                      <span key={c.id} className="badge badge-category text-[10px]">{c.name}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleFetch(source.id)} className="btn-secondary text-xs">Coletar Agora</button>
                  <button onClick={() => handleToggle(source.id, source.enabled)} className={`text-xs px-3 py-1 rounded ${source.enabled ? 'btn-danger' : 'btn-primary'}`}>
                    {source.enabled ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
