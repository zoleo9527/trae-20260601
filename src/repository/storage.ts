const STORAGE_PREFIX = 'cvs_inv_';

export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      if (item === null) {
        return defaultValue;
      }
      return JSON.parse(item) as T;
    } catch (e) {
      console.error(`Storage get error for key ${key}:`, e);
      return defaultValue;
    }
  },

  set: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error(`Storage set error for key ${key}:`, e);
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
      console.error(`Storage remove error for key ${key}:`, e);
    }
  },

  clear: (): void => {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },
};
