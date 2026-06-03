import { create } from 'zustand';
import { User, UserRoleType } from '@/types';
import { DEMO_USERS } from '@/utils/mock';

interface AuthState {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRoleType) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: DEMO_USERS[0],
  setCurrentUser: (user) => set({ currentUser: user }),
  switchRole: (role) => {
    const user = DEMO_USERS.find(u => u.role === role);
    if (user) {
      set({ currentUser: user });
    }
  }
}));
