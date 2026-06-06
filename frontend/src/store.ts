import { create } from 'zustand';
import { Role, InventoryLockOrder } from './types';

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
  currentUser: '李明',
  selectedOrder: null,
  setRole: (role) => set({ currentRole: role }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),
}));
