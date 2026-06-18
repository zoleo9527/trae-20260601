import { create } from 'zustand';
import { User } from '@/types';
import { getCurrentUser } from '@/data/mockUsers';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;

  setCurrentUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: getCurrentUser(),
  isAuthenticated: true,

  setCurrentUser: (user: User) => {
    localStorage.setItem('currentUser', JSON.stringify(user));
    set({ currentUser: user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('currentUser');
    set({ currentUser: null, isAuthenticated: false });
  },
}));
