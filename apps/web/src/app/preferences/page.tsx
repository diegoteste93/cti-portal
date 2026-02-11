'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';

interface Preferences {
  followedTags: string[];
  followedCategories: string[];
  keywordsInclude: string[];
  keywordsExclude: string[];
}

const AVAILABLE_TAGS = [
  'java', 'spring', 'spring_boot', 'node_js', 'npm', 'react', 'react_native',
  'typescript', 'javascript', 'docker', 'kubernetes', 'postgresql', 'redis',
  'maven', 'gradle', 'next_js', 'express', 'nestjs', 'android', 'ios',
  'log4j', 'jackson', 'webpack',
];

const AVAILABLE_CATEGORIES = [
  { slug: 'vulnerability', name: 'Vulnerabilidades' },
  { slug: 'exploit', name: 'Exploits e Ataques' },
  { slug: 'ransomware', name: 'Ransomware' },
  { slug: 'fraud', name: 'Fraude' },
  { slug: 'data_leak', name: 'Vazamentos de Dados' },
  { slug: 'malware', name: 'Malware' },
  { slug: 'phishing', name: 'Phishing' },
  { slug: 'supply_chain', name: 'Cadeia de Suprimentos' },
  { slug: 'general', name: 'Geral' },
];

export default function PreferencesPage() {
  const { user, loading: authLoading } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>({ followedTags: [], followedCategories: [], keywordsInclude: [], keywordsExclude: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [kwInclude, setKwInclude] = useState('');
  const [kwExclude, setKwExclude] = useState('');

  useEffect(() => {
    if (user) {
      api.get<Preferences>('/users/me/preferences')
        .then((p) => {
          setPrefs(p);
          setKwInclude((p.keywordsInclude || []).join(', '));
          setKwExclude((p.keywordsExclude || []).join(', '));
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const toggleTag = (tag: string) => {
    setPrefs((prev) => ({
      ...prev,
      followedTags: prev.followedTags.includes(tag)
        ? prev.followedTags.filter((t) => t !== tag)
        : [...prev.followedTags, tag],
    }));
    setSaved(false);
  };

  const toggleCategory = (slug: string) => {
    setPrefs((prev) => ({
      ...prev,
      followedCategories: prev.followedCategories.includes(slug)
        ? prev.followedCategories.filter((c) => c !== slug)
        : [...prev.followedCategories, slug],
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const split = (s: string) => s.split(',').map((v) => v.trim()).filter(Boolean);
      await api.patch('/users/me/preferences', {
        followedTags: prefs.followedTags,
        followedCategories: prefs.followedCategories,
        keywordsInclude: split(kwInclude),
        keywordsExclude: split(kwExclude),
      });
      setSaved(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <h2 className="text-2xl font-bold mb-2">Preferências do Meu Feed</h2>
        <p className="text-sm text-gray-400 mb-6">
          Personalize seu feed. Essas preferências são combinadas com as políticas dos seus grupos.
        </p>

        {loading ? (
          <div className="text-gray-500">Carregando...</div>
        ) : (
          <div className="max-w-3xl space-y-6">
            {/* Groups info */}
            {user.groups.length > 0 && (
              <div className="card bg-cti-accent/5 border-cti-accent/20">
                <h3 className="text-sm font-semibold mb-2">Seus Grupos</h3>
                <div className="flex flex-wrap gap-2">
                  {user.groups.map((g) => (
                    <span key={g.id} className="badge bg-cti-accent/20 text-cti-accent">{g.name}</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">As políticas de grupo são aplicadas automaticamente ao seu feed.</p>
              </div>
            )}

            {/* Technologies */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Tecnologias</h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      prefs.followedTags.includes(tag)
                        ? 'bg-cti-accent/20 border-cti-accent text-cti-accent'
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Categorias</h3>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => toggleCategory(cat.slug)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      prefs.followedCategories.includes(cat.slug)
                        ? 'bg-purple-900/50 border-purple-700 text-purple-300'
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Palavras-chave</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400">Incluir (separado por vírgula)</label>
                  <input
                    value={kwInclude}
                    onChange={(e) => { setKwInclude(e.target.value); setSaved(false); }}
                    className="input-field"
                    placeholder="ex. log4j, spring boot, react native"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Excluir (separado por vírgula)</label>
                  <input
                    value={kwExclude}
                    onChange={(e) => { setKwExclude(e.target.value); setSaved(false); }}
                    className="input-field"
                    placeholder="ex. wordpress, drupal"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar Preferências'}
              </button>
              {saved && <span className="text-sm text-green-400">Preferências salvas!</span>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
