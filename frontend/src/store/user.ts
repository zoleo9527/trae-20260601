import { create } from 'zustand';
import type { Role } from 'shared';

interface UserState {
  currentRole: Role;
  currentUser: string;
  setRole: (role: Role, user: string) => void;
}

const ROLE_USERS: Record<Role, { user: string; name: string }> = {
  registrar: { user: '李报名', name: '报名员' },
  fieldCoach: { user: '王教练', name: '场地教练' },
  safetyOfficer: { user: '孙安全', name: '安全员' },
};

export const useUserStore = create<UserState>((set) => ({
  currentRole: 'registrar',
  currentUser: ROLE_USERS.registrar.user,
  setRole: (role, user) => set({ currentRole: role, currentUser: user }),
}));

export { ROLE_USERS };

export const getRoleLabel = (role: Role): string => ROLE_USERS[role].name;
export const getRoleDefaultUser = (role: Role): string => ROLE_USERS[role].user;
