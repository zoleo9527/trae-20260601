import { create } from 'zustand';
import type { Anomaly } from '@/lib/api';

interface AppState {
  anomalyDrawerOpen: boolean;
  currentAnomaly: Anomaly | null;
  notificationPanelOpen: boolean;
  openAnomalyDrawer: (anomaly: Anomaly) => void;
  closeAnomalyDrawer: () => void;
  toggleNotificationPanel: () => void;
  closeNotificationPanel: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  anomalyDrawerOpen: false,
  currentAnomaly: null,
  notificationPanelOpen: false,
  openAnomalyDrawer: (anomaly) =>
    set({ anomalyDrawerOpen: true, currentAnomaly: anomaly }),
  closeAnomalyDrawer: () =>
    set({ anomalyDrawerOpen: false, currentAnomaly: null }),
  toggleNotificationPanel: () =>
    set((s) => ({ notificationPanelOpen: !s.notificationPanelOpen })),
  closeNotificationPanel: () =>
    set({ notificationPanelOpen: false }),
}));
