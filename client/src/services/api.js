import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from '../store/authStore';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL:         BASE,
  withCredentials: true,          // always send the httpOnly refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach in-memory access token ─────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: unwrap envelope + auto-refresh on 401 ────────
let refreshPromise = null;   // deduplicates concurrent refresh attempts

api.interceptors.response.use(
  (response) => response.data,

  async (error) => {
    const original = error.config;

    // Auto-refresh: 401 on any non-refresh, non-retry request
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      original._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${BASE}/auth/refresh`, {}, { withCredentials: true })
            .then(r => r.data?.data?.accessToken)
            .finally(() => { refreshPromise = null; });
        }

        const newToken = await refreshPromise;
        if (!newToken) throw new Error('empty');

        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        clearAccessToken();
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error.response?.data ?? error);
  }
);

export default api;
