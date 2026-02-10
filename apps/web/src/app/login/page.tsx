'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithGoogle, devLogin } from '@/lib/auth';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devEmail, setDevEmail] = useState('admin@ctiportal.local');
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
      setError('Google Client ID not configured. Use dev login below.');
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await devLogin(devEmail);
      await refresh();
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-cti-accent mb-2">CTI Portal</h1>
            <p className="text-gray-400 text-sm">Cyber Threat Intelligence Platform</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Google OIDC Login */}
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
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {/* Dev Login */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-2 justify-center mb-3">
              <span className="badge bg-amber-900 text-amber-200">DEV</span>
              <span className="text-xs text-gray-500">Quick login (development only)</span>
            </div>
            <div className="space-y-2">
              <input
                type="email"
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder="Email do usuário"
                className="input-field text-sm"
              />
              <button
                onClick={handleDevLogin}
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Entrando...' : 'Entrar como Dev'}
              </button>
              <p className="text-[10px] text-gray-600 mt-1">
                Default admin: admin@ctiportal.local (criado pelo seed)
              </p>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-600">
            Access restricted to authorized domains only.
          </p>
        </div>
      </div>
    </div>
  );
}
