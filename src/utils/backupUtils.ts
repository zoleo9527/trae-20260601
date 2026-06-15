import { AppState } from '@/types';

export function exportData(state: AppState): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: state,
  };
  return JSON.stringify(exportData, null, 2);
}

export function importData(jsonString: string): AppState | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data || !parsed.version) {
      return null;
    }
    return parsed.data as AppState;
  } catch {
    return null;
  }
}

export function downloadBackup(data: string, filename?: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `rental-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function saveToLocalStorage(state: AppState): void {
  try {
    localStorage.setItem('rental-app-state', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function loadFromLocalStorage(): AppState | null {
  try {
    const saved = localStorage.getItem('rental-app-state');
    if (saved) {
      return JSON.parse(saved) as AppState;
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
}
