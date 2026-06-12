import { create } from 'zustand';
import type { UserRole } from '@/types';

interface AppState {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'consultant',
  setCurrentRole: (role) => set({ currentRole: role }),
}));
