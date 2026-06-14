export const STORAGE_KEYS = {
  TASKS: 'claims_tasks',
  ASSESSMENTS: 'claims_assessments',
  DAMAGE_DETAILS: 'claims_damage_details',
  OPERATION_LOGS: 'claims_operation_logs',
  USERS: 'claims_users',
  CURRENT_USER: 'claims_current_user',
  SETTINGS: 'claims_settings'
};

let memoryStorage: Record<string, string> = {};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

export function getStorageData<T>(key: string): T | null {
  try {
    let data: string | null = null;
    
    if (isBrowser()) {
      data = localStorage.getItem(key);
    } else {
      data = memoryStorage[key] || null;
    }
    
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading from storage: ${key}`, error);
    return null;
  }
}

export function setStorageData<T>(key: string, data: T): void {
  try {
    const serializedData = JSON.stringify(data);
    
    if (isBrowser()) {
      localStorage.setItem(key, serializedData);
    } else {
      memoryStorage[key] = serializedData;
    }
  } catch (error) {
    console.error(`Error writing to storage: ${key}`, error);
  }
}

export function clearStorageData(key: string): void {
  try {
    if (isBrowser()) {
      localStorage.removeItem(key);
    } else {
      delete memoryStorage[key];
    }
  } catch (error) {
    console.error(`Error clearing storage: ${key}`, error);
  }
}

export function clearAllStorage(): void {
  try {
    if (isBrowser()) {
      localStorage.clear();
    } else {
      memoryStorage = {};
    }
  } catch (error) {
    console.error('Error clearing all storage', error);
  }
}

export function getStorageKeys(): string[] {
  try {
    if (isBrowser()) {
      return Object.keys(localStorage);
    } else {
      return Object.keys(memoryStorage);
    }
  } catch (error) {
    console.error('Error getting storage keys', error);
    return [];
  }
}