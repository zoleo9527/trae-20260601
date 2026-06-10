import { create } from 'zustand';
import type { UserRole, RoleInfo } from '../../shared/types.js';

interface AppState {
  currentRole: UserRole;
  roles: RoleInfo[];
  setRole: (role: UserRole) => void;
  showToast: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info';
  showToastMessage: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const roles: RoleInfo[] = [
  { id: 'grower', name: '种植员', description: '花期上报、棚区巡检' },
  { id: 'sales', name: '销售内勤', description: '订单管理、规格变更' },
  { id: 'packaging', name: '包装主管', description: '包装质检、装车复核' },
];

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'packaging',
  roles,
  setRole: (role) => set({ currentRole: role }),
  showToast: false,
  toastMessage: '',
  toastType: 'success',
  showToastMessage: (message, type = 'success') => {
    set({ showToast: true, toastMessage: message, toastType: type });
    setTimeout(() => set({ showToast: false }), 3000);
  },
  hideToast: () => set({ showToast: false }),
}));
