import { useState, useEffect, useCallback } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  const [isForcedOffline, setIsForcedOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleOffline = useCallback(() => {
    setIsForcedOffline(prev => !prev);
  }, []);

  const isOffline = isForcedOffline || !isOnline;

  return {
    isOnline: !isOffline,
    isOffline,
    isForcedOffline,
    toggleOffline,
    setIsForcedOffline,
  };
}
