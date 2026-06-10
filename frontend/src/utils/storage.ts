export function getStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(key);
    if (value === null || value === undefined) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function setStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn(`Failed to set storage key: ${key}`);
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    console.warn(`Failed to remove storage key: ${key}`);
  }
}

export function clearStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.clear();
  } catch {
    console.warn('Failed to clear storage');
  }
}
