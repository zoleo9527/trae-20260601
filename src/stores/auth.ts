import { create } from 'zustand';
import type { User } from '@/types';
import { mockUsers } from '@/data/mockData';

interface AuthStore {
  currentUser: User | null;
  users: User[];
  
  login: (userId: string) => void;
  logout: () => void;
  getTechnicians: () => User[];
  getWarehouseUsers: () => User[];
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: mockUsers[0],
  users: mockUsers,

  login: (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    set({ currentUser: user || null });
  },

  logout: () => {
    set({ currentUser: null });
  },

  getTechnicians: () => {
    return mockUsers.filter(u => u.role === 'technician');
  },

  getWarehouseUsers: () => {
    return mockUsers.filter(u => u.role === 'warehouse');
  },
}));
