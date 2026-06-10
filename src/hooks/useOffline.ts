import { useOfflineStore } from '../store/useOfflineStore';

export function useOffline() {
  const isForcedOffline = useOfflineStore((state) => state.isForcedOffline);
  const isBrowserOnline = useOfflineStore((state) => state.isBrowserOnline);
  const toggleOffline = useOfflineStore((state) => state.toggleOffline);
  const setForcedOffline = useOfflineStore((state) => state.setForcedOffline);

  const isOffline = isForcedOffline || !isBrowserOnline;

  return {
    isOnline: !isOffline,
    isOffline,
    isForcedOffline,
    toggleOffline,
    setForcedOffline,
  };
}
