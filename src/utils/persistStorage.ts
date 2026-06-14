import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { saveData, loadData, removeData, checkTauriEnvironment } from './storage';

const storageAdapter: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const data = await loadData(name);
      return data;
    } catch (error) {
      console.error(`[PersistStorage] 读取 ${name} 失败:`, error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await saveData(name, value);
    } catch (error) {
      console.error(`[PersistStorage] 保存 ${name} 失败:`, error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await removeData(name);
    } catch (error) {
      console.error(`[PersistStorage] 删除 ${name} 失败:`, error);
    }
  },
};

export const persistStorage = createJSONStorage(() => storageAdapter);

export function isTauriStorage(): boolean {
  return checkTauriEnvironment();
}
