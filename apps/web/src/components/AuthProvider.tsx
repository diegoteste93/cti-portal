'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, getCurrentUser } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = async () => {
    const u = await getCurrentUser();
    setUser(u);
    setLoading(false);
    if (!u && pathname !== '/login') {
      router.push('/login');
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
