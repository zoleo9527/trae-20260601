const STORAGE_KEYS = {
  MACHINES: 'pc_assembly_machines',
  EXPORT_TASKS: 'pc_assembly_export_tasks',
  DATA_VERSION: 'pc_assembly_data_version',
};

const CURRENT_VERSION = '2.0';

export function getStoredData<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to store data:', error);
  }
}

export function clearStoredData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}

export function getDataVersion(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.DATA_VERSION) || '1.0';
  } catch {
    return '1.0';
  }
}

export function setDataVersion(version: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DATA_VERSION, version);
  } catch (error) {
    console.error('Failed to set data version:', error);
  }
}

export function needsMigration(): boolean {
  const current = getDataVersion();
  return current < CURRENT_VERSION;
}

export { STORAGE_KEYS, CURRENT_VERSION };
