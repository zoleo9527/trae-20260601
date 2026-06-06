import { create } from 'zustand';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/mock/users';

interface UserState {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  getUserName: (userId: string) => string;
  getUserById: (userId: string) => User | undefined;
  getUsersByRole: (role: UserRole) => User[];
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: mockUsers[0],
  users: mockUsers,

  setCurrentUser: (user) => set({ currentUser: user }),

  getUserName: (userId) => {
    const user = get().users.find(u => u.id === userId);
    return user?.name || '未知用户';
  },

  getUserById: (userId) => get().users.find(u => u.id === userId),

  getUsersByRole: (role) => get().users.filter(u => u.role === role),
}));
