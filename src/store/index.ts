import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Renewal, Communication, RenewalFilter, CommunicationFilter, UserRole } from '../types';

interface UserState {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
}

interface RenewalState {
  renewals: Renewal[];
  filter: RenewalFilter;
  selectedRenewal: Renewal | null;
  drawerOpen: boolean;
  setRenewals: (renewals: Renewal[]) => void;
  setFilter: (filter: RenewalFilter) => void;
  updateRenewal: (renewal: Renewal) => void;
  setSelectedRenewal: (renewal: Renewal | null) => void;
  setDrawerOpen: (open: boolean) => void;
}

interface CommunicationState {
  communications: Communication[];
  filter: CommunicationFilter;
  selectedCommunication: Communication | null;
  drawerOpen: boolean;
  setCommunications: (communications: Communication[]) => void;
  setFilter: (filter: CommunicationFilter) => void;
  updateCommunication: (communication: Communication) => void;
  setSelectedCommunication: (communication: Communication | null) => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentRole: 'admin',
  setCurrentRole: (role) => set({ currentRole: role }),
}));

export const useRenewalStore = create<RenewalState>()(
  persist(
    (set) => ({
      renewals: [],
      filter: {},
      selectedRenewal: null,
      drawerOpen: false,
      setRenewals: (renewals) => set({ renewals }),
      setFilter: (filter) => set({ filter }),
      updateRenewal: (updated) => set((state) => ({
        renewals: state.renewals.map(r => r.id === updated.id ? updated : r)
      })),
      setSelectedRenewal: (renewal) => set({ selectedRenewal: renewal }),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
    }),
    {
      name: 'renewal-storage',
      partialize: (state) => ({ filter: state.filter }),
    }
  )
);

export const useCommunicationStore = create<CommunicationState>()(
  persist(
    (set) => ({
      communications: [],
      filter: {},
      selectedCommunication: null,
      drawerOpen: false,
      setCommunications: (communications) => set({ communications }),
      setFilter: (filter) => set({ filter }),
      updateCommunication: (updated) => set((state) => ({
        communications: state.communications.map(c => c.id === updated.id ? updated : c)
      })),
      setSelectedCommunication: (communication) => set({ selectedCommunication: communication }),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
    }),
    {
      name: 'communication-storage',
      partialize: (state) => ({ filter: state.filter }),
    }
  )
);