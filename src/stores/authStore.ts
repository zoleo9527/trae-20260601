import { create } from 'zustand';
import { UserRole, AuthState } from '../types';
import { storage } from '../utils/storage';

interface AuthStore extends AuthState {
  setCurrentUser: (name: string) => void;
  setRole: (role: UserRole) => void;
}

const initialState: AuthState = storage.get('auth', {
  currentUser: '前台操作员',
  role: 'front_desk' as UserRole,
});

export const useAuthStore = create<AuthStore>((set) => ({
  ...initialState,
  
  setCurrentUser: (name: string) => {
    set({ currentUser: name });
    storage.set('auth', { ...initialState, currentUser: name });
  },
  
  setRole: (role: UserRole) => {
    set({ role });
    const current = storage.get('auth', initialState);
    storage.set('auth', { ...current, role });
  },
}));
