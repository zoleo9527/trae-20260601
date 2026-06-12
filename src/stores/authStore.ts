import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const defaultUsers: Record<UserRole, User> = {
  '税务顾问': {
    id: 'user-001',
    name: '张明',
    role: '税务顾问',
    avatar: 'ZM'
  },
  '项目经理': {
    id: 'user-002',
    name: '王强',
    role: '项目经理',
    avatar: 'WQ'
  },
  '客户财务': {
    id: 'user-003',
    name: '李华',
    role: '客户财务',
    avatar: 'LH'
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: defaultUsers['税务顾问'],
      isAuthenticated: true,
      
      login: (user: User) => set({ user, isAuthenticated: true }),
      
      logout: () => set({ user: null, isAuthenticated: false }),
      
      switchRole: (role: UserRole) => set({ 
        user: defaultUsers[role],
        isAuthenticated: true 
      })
    }),
    {
      name: 'auth-storage'
    }
  )
);
