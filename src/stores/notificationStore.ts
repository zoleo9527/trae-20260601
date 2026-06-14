import { create } from 'zustand';
import type { ToastItem, BannerAlert } from '@/types';

interface NotificationStore {
  toasts: ToastItem[];
  bannerAlert: BannerAlert | null;
  pushToast: (t: ToastItem) => void;
  dismissToast: (id: string) => void;
  showBannerAlert: (b: BannerAlert) => void;
  dismissBanner: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  toasts: [],
  bannerAlert: null,

  pushToast: (t) => {
    set((s) => ({ toasts: [...s.toasts, t] }));
    const duration = t.duration ?? 3500;
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== t.id) }));
      }, duration);
    }
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  showBannerAlert: (b) => set({ bannerAlert: b }),
  dismissBanner: () => set({ bannerAlert: null }),
}));
