import { create } from 'zustand';
import { UserRole, User } from '@/types';
import { users, roleNames } from '@/data/users';

interface UserState {
  currentRole: UserRole;
  currentUser: User;
  setRole: (role: UserRole) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentRole: 'manager',
  currentUser: users.find((u) => u.role === 'manager')!,
  setRole: (role: UserRole) => {
    const user = users.find((u) => u.role === role) || users[0];
    set({ currentRole: role, currentUser: user });
  },
}));

export { roleNames };
