import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Access token lives in memory ONLY — never written to localStorage or cookies.
// It is wiped on page refresh; the silent /auth/refresh call (using the
// httpOnly refresh cookie) re-hydrates it on every app load.
let _accessToken = null;

export const getAccessToken  = ()      => _accessToken;
export const setAccessToken  = (token) => { _accessToken = token; };
export const clearAccessToken = ()     => { _accessToken = null; };

export const useAuthStore = create(
  persist(
    (set) => ({
      // Only non-sensitive profile data is persisted to localStorage.
      // No tokens here — see _accessToken above.
      user: null,

      setAuth: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user });
      },

      updateUser: (user) => set({ user }),

      logout: () => {
        clearAccessToken();
        set({ user: null });
      },
    }),
    {
      name: 'restora-user',
      // Only persist the user profile object, never any token
      partialize: (state) => ({ user: state.user }),
    }
  )
);
