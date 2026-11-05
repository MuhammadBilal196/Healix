import { create } from 'zustand';

const BASE = '/api/v1';

interface AuthState {
  token: string | null;
  user: any | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string) => Promise<{ mfaRequired: boolean; email?: string }>;
  verifyMfa: (email: string, code: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('healix_web_token'),
  user: (() => { try { return JSON.parse(localStorage.getItem('healix_web_user') || 'null'); } catch { return null; } })(),

  login: async (email, password) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: email.trim(), password }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Login failed');

    if (data.data.mfaRequired) return true;
    const { tokens, user } = data.data;
    if (!['ADMIN', 'DOCTOR'].includes(user.role)) throw new Error('Use the mobile app for this account role');
    const accessToken = tokens.accessToken;
    localStorage.setItem('healix_web_refresh', tokens.refreshToken);
    localStorage.setItem('healix_web_token', accessToken);
    localStorage.setItem('healix_web_user', JSON.stringify(user));
    set({ token: accessToken, user });
    return false;
  },
  loginWithGoogle: async (credential) => {
    const res = await fetch(`${BASE}/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Google sign-in failed');
    if (data.data.mfaRequired) return { mfaRequired: true, email: data.data.email };
    const { tokens, user } = data.data;
    if (!['ADMIN', 'DOCTOR'].includes(user.role)) throw new Error('Use the Healix app for this account role');
    localStorage.setItem('healix_web_refresh', tokens.refreshToken);
    localStorage.setItem('healix_web_token', tokens.accessToken);
    localStorage.setItem('healix_web_user', JSON.stringify(user));
    set({ token: tokens.accessToken, user });
    return { mfaRequired: false };
  },
  verifyMfa: async (email, code) => {
    const res = await fetch(`${BASE}/auth/verify-mfa-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emailOrPhone: email.trim(), code: code.trim() }) });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || 'Verification failed');
    const { tokens, user } = data.data;
    if (!['ADMIN', 'DOCTOR'].includes(user.role)) throw new Error('Use the mobile app for this account role');
    localStorage.setItem('healix_web_token', tokens.accessToken);
    localStorage.setItem('healix_web_user', JSON.stringify(user));
    localStorage.setItem('healix_web_refresh', tokens.refreshToken);
    set({ token: tokens.accessToken, user });
  },

  logout: () => {
    const refreshToken = localStorage.getItem('healix_web_refresh');
    localStorage.removeItem('healix_web_refresh');
    if (refreshToken) void fetch(`${BASE}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) }).catch(() => {});
    localStorage.removeItem('healix_web_token');
    localStorage.removeItem('healix_web_user');
    set({ token: null, user: null });
  },
}));

// API helper
export const api = async (method: string, path: string, body?: any, _retried = false): Promise<any> => {
  const token = localStorage.getItem('healix_web_token');
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401) {
    const refreshToken = localStorage.getItem('healix_web_refresh');
    if (!_retried && refreshToken) {
      const refreshRes = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => null);
      if (refreshRes && refreshRes.ok) {
        const refreshData = await refreshRes.json().catch(() => null);
        if (refreshData?.success && refreshData?.data?.accessToken) {
          localStorage.setItem('healix_web_token', refreshData.data.accessToken);
          if (refreshData.data.refreshToken) localStorage.setItem('healix_web_refresh', refreshData.data.refreshToken);
          useAuthStore.setState({ token: refreshData.data.accessToken });
          return api(method, path, body, true);
        }
      }
    }
    if (useAuthStore.getState().token === token) useAuthStore.getState().logout();
    throw new Error('Your session expired. Please sign in again.');
  }
  const data = await res.json().catch(() => { throw new Error('The server returned an unreadable response'); });
  if (!res.ok || !data.success) throw new Error(data.message || 'Request failed');
  return data.data;
};
