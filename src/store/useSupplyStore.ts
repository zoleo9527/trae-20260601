import { create } from 'zustand';
import { SupplyItem } from '@/types';
import { mockSupplyItems } from '@/mock/supplies';

interface SupplyState {
  items: SupplyItem[];
  getItemsByCategory: (category: string) => SupplyItem[];
  getItemById: (id: string) => SupplyItem | undefined;
  updateStock: (itemId: string, quantity: number) => void;
  getLowStockItems: () => SupplyItem[];
  searchItems: (keyword: string) => SupplyItem[];
}

export const useSupplyStore = create<SupplyState>((set, get) => ({
  items: mockSupplyItems,

  getItemsByCategory: (category) => 
    get().items.filter(item => item.category === category),

  getItemById: (id) => get().items.find(item => item.id === id),

  updateStock: (itemId, quantity) => set((state) => ({
    items: state.items.map(item => 
      item.id === itemId 
        ? { ...item, stock: Math.max(0, item.stock - quantity) }
        : item
    ),
  })),

  getLowStockItems: () => 
    get().items.filter(item => item.stock <= item.minStock),

  searchItems: (keyword) => {
    const kw = keyword.toLowerCase();
    return get().items.filter(item => 
      item.name.toLowerCase().includes(kw) ||
      item.category.toLowerCase().includes(kw)
    );
  },
}));
