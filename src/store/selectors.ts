import { useStore } from './store';
import type { Role, TodoItem, SoupBase, SoldOutItem, Order } from '@/types';

export const useTodosByRole = (role: Role) => {
  return useStore((state) => state.todos.filter(t => t.assigneeRole === role));
};

export const usePendingTodosByRole = (role: Role) => {
  return useStore((state) => state.todos.filter(t => t.assigneeRole === role && !t.completed));
};

export const useLowStockSoupBases = () => {
  return useStore((state) => state.soupBases.filter(s => s.stock <= s.minStock));
};

export const useActiveSoldOutItems = () => {
  return useStore((state) => state.soldOutItems.filter(s => s.status === 'active'));
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

export const useSoldOutItemsByStatus = (status: SoldOutItem['status']) => {
  return useStore((state) => state.soldOutItems.filter(s => s.status === status));
};

export const useOrdersByStatus = (status: Order['status']) => {
  return useStore((state) => state.orders.filter(o => o.status === status));
};

export const useStats = () => {
  return useStore((state) => {
    const pendingTodos = state.todos.filter(t => !t.completed).length;
    const lowStockCount = state.soupBases.filter(s => s.stock <= s.minStock).length;
    const activeSoldOut = state.soldOutItems.filter(s => s.status === 'active').length;
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
    const role = state.selectedRole;
    return state.todos.filter(t => t.assigneeRole === role) as TodoItem[];
  });
};
