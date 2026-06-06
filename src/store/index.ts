import { create } from 'zustand';
import type { User } from '@/types';

interface AppState {
  currentUser: User;
  setCurrentUser: (user: User) => void;
}

const initialUser: User = {
  id: 'user-001',
  name: '运营管理员',
  role: 'OPERATION',
};

export const useStore = create<AppState>((set) => ({
  currentUser: initialUser,
  setCurrentUser: (user) => set({ currentUser: user }),
}));

export { scheduleApi, productApi, workflowApi, statsApi } from '@/services/api';
