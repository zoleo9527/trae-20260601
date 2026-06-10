import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OfflineState {
  isForcedOffline: boolean;
  isBrowserOnline: boolean;
  setBrowserOnline: (online: boolean) => void;
  toggleOffline: () => void;
  setForcedOffline: (forced: boolean) => void;
  isOffline: () => boolean;
  isOnline: () => boolean;
}

const getInitialBrowserOnline = () => {
  if (typeof navigator !== 'undefined') {
    return navigator.onLine;
  }
  return true;
};

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      isForcedOffline: false,
      isBrowserOnline: getInitialBrowserOnline(),
      setBrowserOnline: (online) => set({ isBrowserOnline: online }),
      toggleOffline: () => set((state) => ({ isForcedOffline: !state.isForcedOffline })),
      setForcedOffline: (forced) => set({ isForcedOffline: forced }),
      isOffline: () => get().isForcedOffline || !get().isBrowserOnline,
      isOnline: () => !(get().isForcedOffline || !get().isBrowserOnline),
    }),
    {
      name: 'parking_offline_state',
      partialize: (state) => ({ isForcedOffline: state.isForcedOffline }),
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setBrowserOnline(true);
  });
  window.addEventListener('offline', () => {
    useOfflineStore.getState().setBrowserOnline(false);
  });
}
