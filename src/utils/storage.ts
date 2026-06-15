const STORAGE_KEYS = {
  MACHINES: 'pc_assembly_machines',
  EXPORT_TASKS: 'pc_assembly_export_tasks',
};

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

export { STORAGE_KEYS };
