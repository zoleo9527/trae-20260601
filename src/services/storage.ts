import type { Promotion, RecentItem, Role, AppState } from '@/types';

const STORAGE_KEYS = {
  PROMOTIONS: 'retail_promotions',
  RECENT_ITEMS: 'retail_recent_items',
  CURRENT_ROLE: 'retail_current_role',
  VERSION: 'retail_storage_version',
} as const;

const STORAGE_VERSION = '1.0.0';

let memoryBackup: {
  promotions: Promotion[];
  recentItems: RecentItem[];
  currentRole: Role;
} | null = null;

function safeGetItem(key: string): string | null {
  try {
    const value = localStorage.getItem(key);
    return value;
  } catch (e) {
    console.warn('[StorageService] 读取 localStorage 失败:', key, e);
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn('[StorageService] 写入 localStorage 失败:', key, e);
    return false;
  }
}

function safeRemoveItem(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn('[StorageService] 删除 localStorage 失败:', key, e);
    return false;
  }
}

function validatePromotion(data: any): data is Promotion {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.id !== 'string') return false;
  if (typeof data.title !== 'string') return false;
  if (typeof data.status !== 'string') return false;
  if (typeof data.currentRole !== 'string') return false;
  if (!Array.isArray(data.steps)) return false;
  if (!Array.isArray(data.remarks)) return false;
  return true;
}

function validateRecentItem(data: any): data is RecentItem {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.id !== 'string') return false;
  if (typeof data.promotionId !== 'string') return false;
  if (typeof data.title !== 'string') return false;
  return true;
}

function ensureStorageVersion(): void {
  const version = safeGetItem(STORAGE_KEYS.VERSION);
  if (!version) {
    safeSetItem(STORAGE_KEYS.VERSION, STORAGE_VERSION);
  }
}

export class StorageService {
  static getPromotions(): Promotion[] {
    ensureStorageVersion();
    const raw = safeGetItem(STORAGE_KEYS.PROMOTIONS);
    if (!raw) {
      return memoryBackup?.promotions || [];
    }
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        const valid = data.filter(validatePromotion);
        if (memoryBackup) {
          memoryBackup.promotions = valid;
        }
        return valid;
      }
      return memoryBackup?.promotions || [];
    } catch (e) {
      console.warn('[StorageService] 解析 promotions 数据失败，使用内存备份', e);
      return memoryBackup?.promotions || [];
    }
  }

  static savePromotions(promotions: Promotion[]): void {
    ensureStorageVersion();
    const data = JSON.stringify(promotions);
    const success = safeSetItem(STORAGE_KEYS.PROMOTIONS, data);
    if (!memoryBackup) {
      memoryBackup = { promotions: [], recentItems: [], currentRole: 'counterManager' };
    }
    memoryBackup.promotions = promotions;
    if (!success) {
      console.warn('[StorageService] promotions 已保存到内存备份，localStorage 不可用');
    }
  }

  static getPromotion(id: string): Promotion | undefined {
    const promotions = this.getPromotions();
    return promotions.find(p => p.id === id);
  }

  static savePromotion(promotion: Promotion): void {
    if (!validatePromotion(promotion)) {
      console.warn('[StorageService] 尝试保存无效的 promotion 数据');
      return;
    }
    const promotions = this.getPromotions();
    const index = promotions.findIndex(p => p.id === promotion.id);
    if (index >= 0) {
      promotions[index] = promotion;
    } else {
      promotions.unshift(promotion);
    }
    this.savePromotions(promotions);
  }

  static deletePromotion(id: string): void {
    const promotions = this.getPromotions();
    const filtered = promotions.filter(p => p.id !== id);
    this.savePromotions(filtered);
  }

  static getRecentItems(): RecentItem[] {
    ensureStorageVersion();
    const raw = safeGetItem(STORAGE_KEYS.RECENT_ITEMS);
    if (!raw) {
      return memoryBackup?.recentItems || [];
    }
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        const valid = data.filter(validateRecentItem);
        if (memoryBackup) {
          memoryBackup.recentItems = valid;
        }
        return valid;
      }
      return memoryBackup?.recentItems || [];
    } catch (e) {
      console.warn('[StorageService] 解析 recentItems 数据失败，使用内存备份', e);
      return memoryBackup?.recentItems || [];
    }
  }

  static saveRecentItems(items: RecentItem[]): void {
    ensureStorageVersion();
    const limited = items.slice(0, 20);
    const data = JSON.stringify(limited);
    const success = safeSetItem(STORAGE_KEYS.RECENT_ITEMS, data);
    if (!memoryBackup) {
      memoryBackup = { promotions: [], recentItems: [], currentRole: 'counterManager' };
    }
    memoryBackup.recentItems = limited;
    if (!success) {
      console.warn('[StorageService] recentItems 已保存到内存备份，localStorage 不可用');
    }
  }

  static addRecentItem(item: RecentItem): void {
    if (!validateRecentItem(item)) return;
    const items = this.getRecentItems();
    const filtered = items.filter(i => i.promotionId !== item.promotionId);
    filtered.unshift(item);
    this.saveRecentItems(filtered);
  }

  static getCurrentRole(): Role {
    ensureStorageVersion();
    const raw = safeGetItem(STORAGE_KEYS.CURRENT_ROLE);
    const validRoles: Role[] = ['counterManager', 'floorSupervisor', 'brandSupervisor'];
    if (raw && validRoles.includes(raw as Role)) {
      if (memoryBackup) {
        memoryBackup.currentRole = raw as Role;
      }
      return raw as Role;
    }
    return memoryBackup?.currentRole || 'counterManager';
  }

  static setCurrentRole(role: Role): void {
    ensureStorageVersion();
    const validRoles: Role[] = ['counterManager', 'floorSupervisor', 'brandSupervisor'];
    if (!validRoles.includes(role)) return;
    const success = safeSetItem(STORAGE_KEYS.CURRENT_ROLE, role);
    if (!memoryBackup) {
      memoryBackup = { promotions: [], recentItems: [], currentRole: 'counterManager' };
    }
    memoryBackup.currentRole = role;
    if (!success) {
      console.warn('[StorageService] currentRole 已保存到内存备份，localStorage 不可用');
    }
  }

  static exportAll(): string {
    const state: AppState = {
      currentRole: this.getCurrentRole(),
      promotions: this.getPromotions(),
      recentItems: this.getRecentItems(),
    };
    return JSON.stringify({ version: STORAGE_VERSION, ...state }, null, 2);
  }

  static importAll(jsonStr: string): boolean {
    try {
      const state: any = JSON.parse(jsonStr);
      if (state.promotions && Array.isArray(state.promotions)) {
        const valid = state.promotions.filter(validatePromotion);
        this.savePromotions(valid);
      }
      if (state.recentItems && Array.isArray(state.recentItems)) {
        const valid = state.recentItems.filter(validateRecentItem);
        this.saveRecentItems(valid);
      }
      if (state.currentRole) {
        const validRoles: Role[] = ['counterManager', 'floorSupervisor', 'brandSupervisor'];
        if (validRoles.includes(state.currentRole as Role)) {
          this.setCurrentRole(state.currentRole as Role);
        }
      }
      safeSetItem(STORAGE_KEYS.VERSION, state.version || STORAGE_VERSION);
      return true;
    } catch (e) {
      console.warn('[StorageService] 导入数据失败:', e);
      return false;
    }
  }

  static clearAll(): void {
    safeRemoveItem(STORAGE_KEYS.PROMOTIONS);
    safeRemoveItem(STORAGE_KEYS.RECENT_ITEMS);
    safeRemoveItem(STORAGE_KEYS.CURRENT_ROLE);
    memoryBackup = null;
  }

  static isLocalStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}
