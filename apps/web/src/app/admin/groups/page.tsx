'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { isAdmin } from '@/lib/auth';

interface Group {
  id: string;
  name: string;
  description?: string;
  policy?: {
    followedTags: string[];
    followedCategories: string[];
    keywordsInclude: string[];
    keywordsExclude: string[];
  };
}

export default function GroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState<string | null>(null);
  const [policyForm, setPolicyForm] = useState({ tags: '', categories: '', include: '', exclude: '' });

  useEffect(() => {
    if (user) {
      api.get<Group[]>('/groups').then(setGroups).finally(() => setLoading(false));
    }
  }, [user]);

  const startEditPolicy = (group: Group) => {
    setEditingPolicy(group.id);
    setPolicyForm({
      tags: (group.policy?.followedTags || []).join(', '),
      categories: (group.policy?.followedCategories || []).join(', '),
      include: (group.policy?.keywordsInclude || []).join(', '),
      exclude: (group.policy?.keywordsExclude || []).join(', '),
    });
  };

  const savePolicy = async (groupId: string) => {
    const split = (s: string) => s.split(',').map((v) => v.trim()).filter(Boolean);
    await api.patch(`/groups/${groupId}/policy`, {
      followedTags: split(policyForm.tags),
      followedCategories: split(policyForm.categories),
      keywordsInclude: split(policyForm.include),
      keywordsExclude: split(policyForm.exclude),
    });
    const updated = await api.get<Group[]>('/groups');
    setGroups(updated);
    setEditingPolicy(null);
  };

  if (authLoading || !user) return null;
  if (!isAdmin(user)) return <div className="p-8 text-red-400">Acesso negado</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <h2 className="text-2xl font-bold mb-6">Grupos e Políticas</h2>
        <div className="space-y-4">
          {loading ? (
            <div className="text-gray-500">Carregando...</div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    {group.description && <p className="text-sm text-gray-400">{group.description}</p>}
                  </div>
                  <button onClick={() => startEditPolicy(group)} className="btn-secondary text-xs">
                    Editar Política
                  </button>
                </div>

                {editingPolicy === group.id ? (
                  <div className="space-y-3 pt-3 border-t border-gray-800">
                    <div>
                      <label className="text-xs text-gray-400">Tags Seguidas (separadas por vírgula)</label>
                      <input value={policyForm.tags} onChange={(e) => setPolicyForm({...policyForm, tags: e.target.value})} className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Categorias Seguidas (slugs separados por vírgula)</label>
                      <input value={policyForm.categories} onChange={(e) => setPolicyForm({...policyForm, categories: e.target.value})} className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Palavras-chave Incluir</label>
                      <input value={policyForm.include} onChange={(e) => setPolicyForm({...policyForm, include: e.target.value})} className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Palavras-chave Excluir</label>
                      <input value={policyForm.exclude} onChange={(e) => setPolicyForm({...policyForm, exclude: e.target.value})} className="input-field" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => savePolicy(group.id)} className="btn-primary text-xs">Salvar</button>
                      <button onClick={() => setEditingPolicy(null)} className="btn-secondary text-xs">Cancelar</button>
                    </div>
                  </div>
                ) : group.policy ? (
                  <div className="pt-3 border-t border-gray-800 space-y-2">
                    {group.policy.followedTags.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Tags: </span>
                        {group.policy.followedTags.map((t) => <span key={t} className="badge badge-tag text-[10px] mr-1">{t}</span>)}
                      </div>
                    )}
                    {group.policy.followedCategories.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500">Categorias: </span>
                        {group.policy.followedCategories.map((c) => <span key={c} className="badge badge-category text-[10px] mr-1">{c}</span>)}
                      </div>
                    )}
                    {group.policy.keywordsInclude.length > 0 && (
                      <div><span className="text-xs text-gray-500">Palavras-chave Incluir: </span><span className="text-xs text-gray-300">{group.policy.keywordsInclude.join(', ')}</span></div>
                    )}
                    {group.policy.keywordsExclude.length > 0 && (
                      <div><span className="text-xs text-gray-500">Palavras-chave Excluir: </span><span className="text-xs text-gray-300">{group.policy.keywordsExclude.join(', ')}</span></div>
                    )}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
