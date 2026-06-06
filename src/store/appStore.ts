import { create } from 'zustand';
import type { UserRole, User } from '../../shared/types';

interface AppState {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
}

const users: Record<UserRole, User> = {
  dispatcher: { id: 'u1', name: '张调度', role: 'dispatcher', phone: '13800138001' },
  forklift: { id: 'u2', name: '李班长', role: 'forklift', phone: '13800138002' },
  clerk: { id: 'u3', name: '王文员', role: 'clerk', phone: '13800138003' },
};

export const useAppStore = create<AppState>((set) => ({
  currentUser: users.dispatcher,
  setCurrentUser: (user) => set({ currentUser: user }),
  switchRole: (role) => set({ currentUser: users[role] }),
}));
