import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole } from '@/types/common';
import { roleLabels } from '@/types/common';

interface RoleState {
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  getRoleName: () => string;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      currentRole: 'schedule_manager',
      setRole: (role) => set({ currentRole: role }),
      getRoleName: () => roleLabels[get().currentRole],
    }),
    {
      name: 'cinema-ops-role',
    }
  )
);
