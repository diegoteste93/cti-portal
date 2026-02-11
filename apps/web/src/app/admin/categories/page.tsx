'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { isAdmin, isEditor } from '@/lib/auth';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      api.get<Category[]>('/categories').then(setCategories).finally(() => setLoading(false));
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/categories', form);
      const cats = await api.get<Category[]>('/categories');
      setCategories(cats);
      setShowForm(false);
      setForm({ name: '', slug: '', description: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;
  if (!isAdmin(user) && !isEditor(user)) return <div className="p-8 text-red-400">Acesso negado</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Categorias ({categories.length})</h2>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">{showForm ? 'Cancelar' : '+ Adicionar Categoria'}</button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="card mb-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({...form, slug: e.target.value})} className="input-field" required placeholder="ex. minha_categoria" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="input-field" />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Criar Categoria'}</button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="text-gray-500">Carregando...</div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="card">
                <h3 className="font-semibold">{cat.name}</h3>
                <p className="text-xs text-gray-500 font-mono">{cat.slug}</p>
                {cat.description && <p className="text-sm text-gray-400 mt-1">{cat.description}</p>}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
