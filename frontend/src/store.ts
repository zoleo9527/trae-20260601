import { create } from 'zustand';
import { Role, InventoryLockOrder } from './types';

export const RoleUserMap: Record<Role, string> = {
  ASSISTANT: '李明',
  STAGE_CONTROL: '王芳',
  AFTER_SALES_LEAD: '赵敏'
};

interface AppState {
  currentRole: Role;
  currentUser: string;
  selectedOrder: InventoryLockOrder | null;
  setRole: (role: Role) => void;
  setCurrentUser: (user: string) => void;
  setSelectedOrder: (order: InventoryLockOrder | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'ASSISTANT',
  currentUser: RoleUserMap.ASSISTANT,
  selectedOrder: null,
  setRole: (role) => set({ 
    currentRole: role, 
    currentUser: RoleUserMap[role] 
  }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
}));
