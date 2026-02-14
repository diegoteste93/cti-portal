'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithGoogle, passwordLogin } from '@/lib/auth';
import { useAuth } from '@/components/AuthProvider';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const router = useRouter();
  const { refresh } = useAuth();

  const handleGoogleRedirect = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId) {
      const redirectUri = encodeURIComponent(window.location.origin + '/login');
      const scope = encodeURIComponent('openid email profile');
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=id_token&scope=${scope}&nonce=${Date.now()}`;
      window.location.href = url;
    } else {
      setError('Google Client ID não configurado. Entre com email e senha.');
    }
  };

  const handlePasswordLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await passwordLogin(accountEmail, accountPassword);
      await refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Falha no login com senha');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleTokenLogin = async () => {
    const hash = window.location.hash.replace('#', '');
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    if (!idToken) return;

    setLoading(true);
    setError('');
    try {
      await loginWithGoogle(idToken);
      await refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Falha no login com Google');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('id_token=')) {
      handleGoogleTokenLogin();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-3 flex justify-end">
          <div className="w-36"><ThemeToggle /></div>
        </div>
        <div className="card text-center">
          <div className="mb-8 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-cti-accent/15 border border-cti-accent/30 flex items-center justify-center mb-3">
              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L4 6V12C4 17 7.4 21.7 12 23C16.6 21.7 20 17 20 12V6L12 2Z" stroke="#38bdf8" strokeWidth="1.8"/>
                <path d="M9 12L11 14L15 10" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-cti-accent mb-2">CTI Portal</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Plataforma de Inteligência de Ameaças Cibernéticas</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleRedirect}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Entrando...' : 'Entrar com Google'}
          </button>

          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2 justify-center mb-3">
              <span className="badge bg-indigo-900 text-indigo-200">CONTA</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Entrar com email e senha</span>
            </div>
            <div className="space-y-2">
              <input
                type="email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="Email"
                className="input-field text-sm"
              />
              <input
                type="password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="Senha"
                className="input-field text-sm"
              />
              <button
                onClick={handlePasswordLogin}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Entrando...' : 'Entrar com senha'}
              </button>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-600">
            Acesso restrito apenas a domínios autorizados.
          </p>
        </div>
      </div>
    </div>
  );
}
