import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/services/api';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: async (username: string, password: string) => {
        const res = await authApi.login(username, password);
        set({ token: res.token, user: res.user });
      },
      logout: async () => {
        try {
          await authApi.logout();
        } catch (e) {
          console.error('Logout error:', e);
        }
        set({ token: null, user: null });
      },
      fetchMe: async () => {
        try {
          const user = await authApi.me();
          set({ user: user as any });
        } catch (e) {
          console.error('Fetch me error:', e);
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
