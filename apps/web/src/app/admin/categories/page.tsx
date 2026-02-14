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

const emptyForm = { name: '', slug: '', description: '' };

export default function CategoriesPage() {
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    const data = await api.get<Category[]>('/categories');
    setCategories(data);
  };

  useEffect(() => {
    if (!user) return;

    loadCategories()
      .catch((err) => alert(err.message || 'Falha ao carregar categorias'))
      .finally(() => setLoading(false));
  }, [user]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowCreateForm(true);
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setShowCreateForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/categories/${editingId}`, form);
      } else {
        await api.post('/categories', form);
      }
      await loadCategories();
      setShowCreateForm(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!isAdmin(user!)) {
      alert('Apenas administradores podem excluir categorias.');
      return;
    }

    if (!confirm(`Excluir categoria "${category.name}"?`)) return;

    try {
      await api.delete(`/categories/${category.id}`);
      await loadCategories();
    } catch (err: any) {
      alert(err.message || 'Falha ao excluir categoria');
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
          <button onClick={showCreateForm ? () => setShowCreateForm(false) : startCreate} className="btn-primary">
            {showCreateForm ? 'Cancelar' : '+ Adicionar Categoria'}
          </button>
        </div>

        {showCreateForm && (
          <form onSubmit={handleSave} className="card mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nome</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input-field" required placeholder="ex.: minha_categoria" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descrição</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Categoria'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                >
                  Limpar edição
                </button>
              )}
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="text-gray-500">Carregando...</div>
          ) : categories.map((cat) => (
            <div key={cat.id} className="card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{cat.name}</h3>
                  <p className="text-xs text-gray-500 font-mono">{cat.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(cat)} className="btn-secondary text-xs px-2 py-1">Editar</button>
                  {isAdmin(user) && (
                    <button onClick={() => handleDelete(cat)} className="btn-danger text-xs px-2 py-1">Excluir</button>
                  )}
                </div>
              </div>
              {cat.description && <p className="text-sm text-gray-400 mt-2">{cat.description}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
