import { useStore } from './store';
import type { Role, TodoItem, SoupBase, SoldOut, Order } from '@/types';

export const useLowStockSoupBases = () => {
  return useStore((state) => state.soupBases.filter(s => s.stock <= s.minStock));
};

export const useActiveSoldOuts = () => {
  return useStore((state) => state.soldOuts.filter(s => s.status === 'active'));
};

export const usePendingOrders = () => {
  return useStore((state) => state.orders.filter(o => o.status === 'pending' || o.status === 'confirmed'));
};

export const usePendingGroupBuyOrders = () => {
  return useStore((state) => state.orders.filter(o => o.isGroupBuy && !o.groupBuyVerified));
};

export const useSoupBasesByStatus = (status: SoupBase['status']) => {
  return useStore((state) => state.soupBases.filter(s => s.status === status));
};

export const useSoldOutsByStatus = (status: SoldOut['status']) => {
  return useStore((state) => state.soldOuts.filter(s => s.status === status));
};

export const useOrdersByStatus = (status: Order['status']) => {
  return useStore((state) => state.orders.filter(o => o.status === status));
};

export const useStats = () => {
  return useStore((state) => {
    const pendingTodos = state.todoItems.filter(t => !t.completed).length;
    const lowStockCount = state.soupBases.filter(s => s.stock <= s.minStock).length;
    const activeSoldOut = state.soldOuts.filter(s => s.status === 'active').length;
    const pendingOrders = state.orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const pendingGroupBuy = state.orders.filter(o => o.isGroupBuy && !o.groupBuyVerified).length;
    
    return {
      pendingTodos,
      lowStockCount,
      activeSoldOut,
      pendingOrders,
      pendingGroupBuy,
    };
  });
};

export const useRoleTodos = () => {
  return useStore((state) => {
    const role = state.currentUser.role;
    return state.todoItems.filter(t => t.assigneeRole === role) as TodoItem[];
  });
};
