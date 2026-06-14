import { invoke } from '@tauri-apps/api/core';

export interface StorageInfo {
  totalSize: number;
  fileCount: number;
  path: string;
}

export interface FileInfo {
  name: string;
  size: number;
  created_at: string;
  path: string;
}

let isTauriEnv: boolean | null = null;

export function checkTauriEnvironment(): boolean {
  if (isTauriEnv !== null) {
    return isTauriEnv;
  }
  isTauriEnv = typeof window !== 'undefined' && 
    '__TAURI_INTERNALS__' in window &&
    !!(window as any).__TAURI_INTERNALS__;
  return isTauriEnv;
}

async function invokeTauri<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!checkTauriEnvironment()) {
    throw new Error('Not running in Tauri environment');
  }
  return invoke<T>(command, args);
}

export async function saveData(key: string, data: string): Promise<string> {
  if (checkTauriEnvironment()) {
    try {
      const result = await invokeTauri<string>('save_to_file', {
        filename: `${key}.json`,
        content: data,
      });
      console.log(`[Tauri Storage] 已保存到文件: ${result}`);
      return result;
    } catch (error) {
      console.error('[Tauri Storage] 保存文件失败，降级到 localStorage:', error);
    }
  }

  localStorage.setItem(key, data);
  console.log(`[LocalStorage] 已保存: ${key}`);
  return `localStorage://${key}`;
}

export async function loadData(key: string): Promise<string | null> {
  if (checkTauriEnvironment()) {
    try {
      const result = await invokeTauri<string>('read_from_file', {
        filename: `${key}.json`,
      });
      console.log(`[Tauri Storage] 已读取文件: ${key}`);
      return result;
    } catch (error) {
      console.warn('[Tauri Storage] 读取文件失败，尝试 localStorage:', error);
    }
  }

  const data = localStorage.getItem(key);
  if (data) {
    console.log(`[LocalStorage] 已读取: ${key}`);
  }
  return data;
}

export async function removeData(key: string): Promise<void> {
  if (checkTauriEnvironment()) {
    try {
      await invokeTauri<void>('delete_file', {
        filename: `${key}.json`,
      });
      console.log(`[Tauri Storage] 已删除文件: ${key}`);
    } catch (error) {
      console.error('[Tauri Storage] 删除文件失败:', error);
    }
  }

  localStorage.removeItem(key);
  console.log(`[LocalStorage] 已删除: ${key}`);
}

export async function getStorageInfo(): Promise<StorageInfo> {
  if (checkTauriEnvironment()) {
    try {
      const result = await invokeTauri<[number, number, string]>('get_storage_info');
      return {
        totalSize: result[0],
        fileCount: result[1],
        path: result[2],
      };
    } catch (error) {
      console.error('[Tauri Storage] 获取存储信息失败:', error);
    }
  }

  let totalSize = 0;
  let fileCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += new Blob([value]).size;
        fileCount++;
      }
    }
  }

  return {
    totalSize,
    fileCount,
    path: 'Browser localStorage',
  };
}

export async function listFiles(extension?: string): Promise<FileInfo[]> {
  if (checkTauriEnvironment()) {
    try {
      const result = await invokeTauri<FileInfo[]>('list_files', {
        extension,
      });
      return result;
    } catch (error) {
      console.error('[Tauri Storage] 列出文件失败:', error);
    }
  }

  const files: FileInfo[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        if (extension && !key.endsWith(`.${extension}`)) {
          continue;
        }
        files.push({
          name: key,
          size: new Blob([value]).size,
          created_at: '未知',
          path: `localStorage://${key}`,
        });
      }
    }
  }
  return files;
}

export async function exportBackup(content: string): Promise<string> {
  if (checkTauriEnvironment()) {
    try {
      const result = await invokeTauri<string>('export_backup', {
        content,
      });
      console.log(`[Tauri Storage] 已导出备份: ${result}`);
      return result;
    } catch (error) {
      console.error('[Tauri Storage] 导出备份失败:', error);
    }
  }

  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `insurance_backup_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return 'Browser download';
}

export async function importBackup(filePath: string): Promise<string> {
  if (checkTauriEnvironment()) {
    try {
      const result = await invokeTauri<string>('import_backup', {
        file_path: filePath,
      });
      console.log(`[Tauri Storage] 已导入备份: ${filePath}`);
      return result;
    } catch (error) {
      console.error('[Tauri Storage] 导入备份失败:', error);
      throw error;
    }
  }

  throw new Error('浏览器环境不支持文件路径导入，请使用文件选择');
}
