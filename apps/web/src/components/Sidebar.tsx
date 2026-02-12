'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthUser, isAdmin, isEditor, logout } from '@/lib/auth';

const nav = [
  { href: '/dashboard', label: 'Painel', icon: '□' },
  { href: '/feed', label: 'Feed', icon: '◈' },
  { href: '/preferences', label: 'Meu Feed', icon: '☆' },
];

const adminNav = [
  { href: '/admin/sources', label: 'Fontes', icon: '⊕' },
  { href: '/admin/categories', label: 'Categorias', icon: '≡' },
  { href: '/admin/users', label: 'Usuários', icon: '⊙' },
  { href: '/admin/groups', label: 'Grupos', icon: '⊞' },
  { href: '/admin/audit', label: 'Log de Auditoria', icon: '◎' },
];
const buildTimeLabel = (() => {
  const raw = process.env.NEXT_PUBLIC_BUILD_TIME;
  if (!raw) return 'não informado';

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date);
})();

const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'local';

const branchName = process.env.NEXT_PUBLIC_BRANCH_NAME || 'prd';

const logoStoragePrefix = 'cti_custom_logo_url';

export default function Sidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const [customLogoUrl, setCustomLogoUrl] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.id) return;

    const scoped = localStorage.getItem(`${logoStoragePrefix}:${user.id}`);
    const fallback = localStorage.getItem(logoStoragePrefix);
    setCustomLogoUrl(scoped || fallback || '');
  }, [user?.id]);

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        {customLogoUrl ? (
          <img
            src={customLogoUrl}
            alt="Logo personalizada"
            className="h-12 w-auto max-w-full object-contain"
          />
        ) : (
          <h1 className="text-xl font-bold text-cti-accent">CTI Portal</h1>
        )}
        <p className="text-xs text-gray-500 mt-1">Inteligência de Ameaças</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? 'bg-cti-accent/10 text-cti-accent'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {(isAdmin(user) || isEditor(user)) && (
          <>
            <div className="pt-4 pb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administração
              </span>
            </div>
            {adminNav.map((item) => {
              if (['Usuários', 'Grupos', 'Log de Auditoria'].includes(item.label) && !isAdmin(user)) return null;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname.startsWith(item.href)
                      ? 'bg-cti-accent/10 text-cti-accent'
                      : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3">
          {user.picture && (
            <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-3 w-full text-left text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          Sair
        </button>
        <div className="mt-3 pt-3 border-t border-gray-800 text-[11px] text-gray-500">
          <p>Branch PRD: <span className="font-mono">{branchName}</span></p>
          <p>Versão PRD: <span className="font-mono">{commitHash}</span></p>
          <p>Atualizado em: {buildTimeLabel}</p>
        </div>
      </div>
    </aside>
  );
}
