import { create } from 'zustand';
import { Role } from './types';

export const RoleUserMap: Record<Role, string> = {
  WAREHOUSE: '张三',
  QUALITY: '李四',
  MANAGER: '王五'
};

interface AppState {
  currentRole: Role;
  currentUser: string;
  setRole: (role: Role) => void;
  setCurrentUser: (user: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'WAREHOUSE',
  currentUser: RoleUserMap.WAREHOUSE,
  setRole: (role) => set({ 
    currentRole: role, 
    currentUser: RoleUserMap[role] 
  }),
  setCurrentUser: (user) => set({ currentUser: user }),
}));