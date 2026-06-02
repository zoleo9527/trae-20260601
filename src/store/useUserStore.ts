import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface UserState {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: mockUsers[0],
  users: mockUsers,
  
  setCurrentUser: (user) => set({ currentUser: user }),
  
  switchRole: (role) => {
    const user = mockUsers.find((u) => u.role === role);
    if (user) {
      set({ currentUser: user });
    }
  },
}));
