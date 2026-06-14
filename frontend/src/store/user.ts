import { create } from 'zustand';
import type { Role } from 'shared';
import { DEMO_ACCOUNTS } from 'shared';

interface UserState {
  currentRole: Role;
  currentUser: string;
  setRole: (role: Role, user: string) => void;
}

export const ROLE_USERS = DEMO_ACCOUNTS;

export const useUserStore = create<UserState>((set) => ({
  currentRole: 'purchaseManager',
  currentUser: ROLE_USERS.purchaseManager.user,
  setRole: (role, user) => set({ currentRole: role, currentUser: user }),
}));

export const getRoleLabel = (role: Role): string => ROLE_USERS[role].name;
export const getRoleDefaultUser = (role: Role): string => ROLE_USERS[role].user;
