export const STORAGE_KEYS = {
  TASKS: 'claims_tasks',
  ASSESSMENTS: 'claims_assessments',
  DAMAGE_DETAILS: 'claims_damage_details',
  OPERATION_LOGS: 'claims_operation_logs',
  USERS: 'claims_users',
  CURRENT_USER: 'claims_current_user',
  SETTINGS: 'claims_settings'
};

export function getStorageData<T>(key: string): T | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return null;
  }
}

export function setStorageData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error);
  }
}

export function clearStorageData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing localStorage: ${key}`, error);
  }
}
