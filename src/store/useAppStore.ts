import { create } from 'zustand';
import type { Promotion, Role, RecentItem } from '@/types';
import { StorageService } from '@/services/storage';
import { PromotionService } from '@/services/promotion';
import { generateId } from '@/utils/id';

interface AppStore {
  currentRole: Role;
  promotions: Promotion[];
  recentItems: RecentItem[];
  isInitialized: boolean;
  
  initialize: () => void;
  setCurrentRole: (role: Role) => void;
  refreshPromotions: () => void;
  addRecentItem: (promotionId: string, title: string) => void;
  
  createPromotion: (params: {
    title: string;
    counter: string;
    brand: string;
    type: string;
    startDate: string;
    endDate: string;
    budget: number;
    description: string;
    operator: string;
  }) => Promotion;
  
  updatePromotion: (params: {
    promotionId: string;
    title?: string;
    counter?: string;
    brand?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    description?: string;
  }) => Promotion | null;
  
  processPromotion: (params: {
    promotionId: string;
    role: Role;
    action: 'submit' | 'approve' | 'reject' | 'complete';
    operator: string;
    comment: string;
    remarkContent?: string;
  }) => Promotion | null;
  
  addRemark: (params: {
    promotionId: string;
    stepId?: string;
    role: Role;
    content: string;
    operator: string;
  }) => Promotion | null;
  
  addSalesData: (params: {
    promotionId: string;
    actualSales: number;
    targetSales: number;
    customerCount: number;
    operator: string;
    comment: string;
  }) => Promotion | null;
  
  getPromotion: (id: string) => Promotion | undefined;
  getPendingPromotions: () => Promotion[];
  getSalesReviewPromotions: () => Promotion[];
  importData: (promotions: Promotion[]) => void;
  clearAllData: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  currentRole: 'counterManager',
  promotions: [],
  recentItems: [],
  isInitialized: false,

  initialize: () => {
    if (get().isInitialized) return;
    
    const currentRole = StorageService.getCurrentRole();
    const promotions = StorageService.getPromotions();
    const recentItems = StorageService.getRecentItems();
    
    set({
      currentRole,
      promotions,
      recentItems,
      isInitialized: true,
    });
  },

  setCurrentRole: (role: Role) => {
    StorageService.setCurrentRole(role);
    set({ currentRole: role });
  },

  refreshPromotions: () => {
    const promotions = StorageService.getPromotions();
    set({ promotions });
  },

  addRecentItem: (promotionId: string, title: string) => {
    const item: RecentItem = {
      id: generateId(),
      promotionId,
      title,
      openedAt: new Date().toISOString(),
    };
    StorageService.addRecentItem(item);
    set({ recentItems: StorageService.getRecentItems() });
  },

  createPromotion: (params) => {
    const promotion = PromotionService.createPromotion(params);
    get().refreshPromotions();
    return promotion;
  },

  updatePromotion: (params) => {
    const result = PromotionService.updatePromotion(params);
    if (result) {
      get().refreshPromotions();
    }
    return result;
  },

  processPromotion: (params) => {
    const result = PromotionService.processPromotion(params);
    if (result) {
      get().refreshPromotions();
    }
    return result;
  },

  addRemark: (params) => {
    const result = PromotionService.addRemark(params);
    if (result) {
      get().refreshPromotions();
    }
    return result;
  },

  addSalesData: (params) => {
    const result = PromotionService.addSalesData(params);
    if (result) {
      get().refreshPromotions();
    }
    return result;
  },

  getPromotion: (id: string) => {
    return get().promotions.find(p => p.id === id);
  },

  getPendingPromotions: () => {
    const { currentRole, promotions } = get();
    return promotions.filter(p => 
      p.currentRole === currentRole && p.status !== 'completed'
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  getSalesReviewPromotions: () => {
    return get().promotions
      .filter(p => p.salesData || p.status === 'completed' || p.status === 'salesPending')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  importData: (promotions: Promotion[]) => {
    promotions.forEach(p => StorageService.savePromotion(p));
    get().refreshPromotions();

    const currentPromotions = get().promotions;
    const validIds = new Set(currentPromotions.map(p => p.id));
    const recentItems = StorageService.getRecentItems();
    const cleaned = recentItems.filter(item => validIds.has(item.promotionId));
    if (cleaned.length !== recentItems.length) {
      StorageService.saveRecentItems(cleaned);
    }
    set({ recentItems: StorageService.getRecentItems() });
  },

  clearAllData: () => {
    StorageService.clearAll();
    set({ promotions: [], recentItems: [] });
  },
}));
