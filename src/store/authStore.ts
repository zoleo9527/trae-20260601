import { create } from 'zustand';
import type { UserRole } from '@shared/types';

interface AuthState {
  user: { id: string; name: string; role: UserRole; username: string } | null;
  setUser: (u: AuthState['user']) => void;
  logout: () => void;
}

const storedRole = localStorage.getItem('user_role') as UserRole | null;
const storedName = localStorage.getItem('user_name');
const storedId = localStorage.getItem('user_id');
const storedUsername = localStorage.getItem('user_username');

export const useAuthStore = create<AuthState>((set) => ({
  user:
    storedRole && storedName && storedId && storedUsername
      ? { id: storedId, name: storedName, role: storedRole, username: storedUsername }
      : null,
  setUser: (u) => {
    if (u) {
      localStorage.setItem('user_id', u.id);
      localStorage.setItem('user_name', u.name);
      localStorage.setItem('user_role', u.role);
      localStorage.setItem('user_username', u.username);
    }
    set({ user: u });
  },
  logout: () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_username');
    set({ user: null });
  },
}));
