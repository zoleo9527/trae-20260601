import { create } from 'zustand';
import type { UserRole, User } from '@/types';

interface AuthStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  
  login: (role: UserRole) => void;
  logout: () => void;
}

const USER_MAPPINGS: Record<UserRole, User> = {
  brewer: { id: 'user-brewer', name: '张酿酒师', role: 'brewer' },
  packaging: { id: 'user-packaging', name: '王主管', role: 'packaging' },
  sales: { id: 'user-sales', name: '刘内勤', role: 'sales' },
};

const getInitialUser = () => {
  if (typeof window === 'undefined') return null;
  const savedUser = localStorage.getItem('qc_user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      console.error('Failed to parse saved user');
    }
  }
  return null;
};

const initialUser = getInitialUser();

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: initialUser,
  isAuthenticated: !!initialUser,
  
  login: (role) => {
    const user = USER_MAPPINGS[role];
    localStorage.setItem('qc_user_role', role);
    localStorage.setItem('qc_user', JSON.stringify(user));
    set({ currentUser: user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('qc_user_role');
    localStorage.removeItem('qc_user');
    set({ currentUser: null, isAuthenticated: false });
  },
}));
