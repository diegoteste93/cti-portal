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

const emptyForm = {
  name: '',
  type: 'rss',
  url: '',
  scheduleCron: '0 */4 * * *',
  categoryIds: [] as string[],
};

export default function SourcesPage() {
  const { user, loading: authLoading } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const [sourcesResponse, categoriesResponse] = await Promise.all([
      api.get<any>('/sources'),
      api.get<any[]>('/categories'),
    ]);
    setSources(sourcesResponse.data);
    setTotal(sourcesResponse.total);
    setCategories(categoriesResponse);
  };

  useEffect(() => {
    if (!user) return;

    loadData()
      .catch((err) => alert(err.message || 'Falha ao carregar fontes'))
      .finally(() => setLoading(false));
  }, [user]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (source: Source) => {
    setEditingId(source.id);
    setForm({
      name: source.name,
      type: source.type,
      url: source.url,
      scheduleCron: source.scheduleCron || '0 */4 * * *',
      categoryIds: (source.categories || []).map((category) => category.id),
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/sources/${editingId}`, form);
      } else {
        await api.post('/sources', form);
      }
      await loadData();
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar fonte');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await api.patch(`/sources/${id}`, { enabled: !enabled });
    await loadData();
  };

  const handleFetch = async (id: string) => {
    await api.post(`/sources/${id}/fetch`);
    alert('Coleta enfileirada com sucesso');
  };

  const handleDelete = async (source: Source) => {
    if (!isAdmin(user!)) {
      alert('Apenas administradores podem excluir fontes.');
      return;
    }

    if (!confirm(`Excluir fonte "${source.name}"?`)) return;

    try {
      await api.delete(`/sources/${source.id}`);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Falha ao excluir fonte');
    }
  };

  if (authLoading || !user) return null;
  if (!isAdmin(user) && !isEditor(user)) return <div className="p-8 text-red-400">Acesso negado</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Fontes ({total})</h2>
          <button onClick={showForm ? () => setShowForm(false) : openCreateForm} className="btn-primary">
            {showForm ? 'Cancelar' : '+ Adicionar Fonte'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSave} className="card mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                  <option value="rss">RSS</option>
                  <option value="generic_api">API Genérica (JSON)</option>
                  <option value="github_releases">GitHub Advisory</option>
                  <option value="html_scrape">Raspador HTML</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">URL</label>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Agendamento (cron)</label>
                <input value={form.scheduleCron} onChange={(e) => setForm({ ...form, scheduleCron: e.target.value })} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Categorias</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(category.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, categoryIds: [...form.categoryIds, category.id] });
                        } else {
                          setForm({ ...form, categoryIds: form.categoryIds.filter((id) => id !== category.id) });
                        }
                      }}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Fonte'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setShowForm(false);
                  }}
                >
                  Limpar edição
                </button>
              )}
            </div>
          </form>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="text-gray-500">Carregando...</div>
          ) : sources.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">Nenhuma fonte configurada ainda.</div>
          ) : (
            sources.map((source) => (
              <div key={source.id} className="card flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${source.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
                    <h3 className="font-semibold">{source.name}</h3>
                    <span className="badge bg-gray-700 text-gray-300">{source.type}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{source.url}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-600">Cron: {source.scheduleCron}</span>
                    {source.categories.map((category) => (
                      <span key={category.id} className="badge badge-category text-[10px]">{category.name}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={() => openEditForm(source)} className="btn-secondary text-xs">Editar</button>
                  <button onClick={() => handleFetch(source.id)} className="btn-secondary text-xs">Coletar Agora</button>
                  <button onClick={() => handleToggle(source.id, source.enabled)} className={`text-xs px-3 py-1 rounded ${source.enabled ? 'btn-danger' : 'btn-primary'}`}>
                    {source.enabled ? 'Desativar' : 'Ativar'}
                  </button>
                  {isAdmin(user) && (
                    <button onClick={() => handleDelete(source)} className="btn-danger text-xs">Excluir</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
