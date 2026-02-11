import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  groups?: { id: string; name: string }[];
}

function normalizeUser(user: AuthUser): AuthUser {
  return {
    ...user,
    groups: user.groups || [],
  };
}

export async function loginWithGoogle(idToken: string): Promise<AuthUser> {
  const result = await api.post<{ accessToken: string; user: AuthUser }>('/auth/google', { idToken });
  api.setToken(result.accessToken);
  return normalizeUser(result.user);
}

export async function devLogin(email: string): Promise<AuthUser> {
  const result = await api.post<{ accessToken: string; user: AuthUser }>('/auth/dev-login', { email });
  api.setToken(result.accessToken);
  return normalizeUser(result.user);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    if (!api.getToken()) return null;
    const user = await api.get<AuthUser>('/auth/me');
    return normalizeUser(user);
  } catch {
    return null;
  }
}

export function logout() {
  api.clearToken();
  window.location.href = '/login';
}

export function isAdmin(user: AuthUser) {
  return user.role === 'admin';
}

export function isEditor(user: AuthUser) {
  return ['admin', 'cti_editor'].includes(user.role);
}
