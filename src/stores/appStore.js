import { create } from 'zustand';

const API_BASE = '/api';

async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error?.message || 'API Error');
  }
  return data.data;
}

export const useStore = create((set, get) => ({
  // Current user
  currentUser: null,
  users: [],
  setCurrentUser: (user) => set({ currentUser: user }),

  // Data
  sales: [],
  currentSale: null,
  pesticides: [],
  customers: [],
  inventory: [],
  credits: [],

  // UI State
  loading: false,
  error: null,

  // Initialize
  initialize: async () => {
    set({ loading: true, error: null });
    try {
      const [users, pesticides, customers, inventory] = await Promise.all([
        fetchApi('/users'),
        fetchApi('/pesticides'),
        fetchApi('/customers'),
        fetchApi('/inventory'),
      ]);
      set({ users, pesticides, customers, inventory, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Sales actions
  fetchSales: async (filters = {}) => {
    set({ loading: true });
    try {
      const query = new URLSearchParams(filters).toString();
      const sales = await fetchApi(`/sales${query ? `?${query}` : ''}`);
      set({ sales, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSaleById: async (id) => {
    set({ loading: true });
    try {
      const sale = await fetchApi(`/sales/${id}`);
      set({ currentSale: sale, loading: false });
      return sale;
    } catch (error) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  createSale: async (data) => {
    set({ loading: true, error: null });
    try {
      const sale = await fetchApi('/sales', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      await get().fetchSales();
      return sale;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  submitSale: async (id, operatorId) => {
    set({ loading: true });
    try {
      const sale = await fetchApi(`/sales/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ operatorId }),
      });
      set({ currentSale: sale, loading: false });
      return sale;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  confirmSale: async (id, operatorId, data) => {
    set({ loading: true });
    try {
      const sale = await fetchApi(`/sales/${id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ operatorId, ...data }),
      });
      set({ currentSale: sale, loading: false });
      return sale;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  warehouseConfirmSale: async (id, operatorId, data = {}) => {
    set({ loading: true });
    try {
      const sale = await fetchApi(`/sales/${id}/warehouse-confirm`, {
        method: 'POST',
        body: JSON.stringify({ operatorId, ...data }),
      });
      set({ currentSale: sale, loading: false });
      return sale;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  resetSale: async (id, operatorId) => {
    set({ loading: true });
    try {
      const sale = await fetchApi(`/sales/${id}/reset`, {
        method: 'POST',
        body: JSON.stringify({ operatorId }),
      });
      set({ currentSale: sale, loading: false });
      return sale;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  cancelSale: async (id, operatorId) => {
    set({ loading: true });
    try {
      const sale = await fetchApi(`/sales/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ operatorId }),
      });
      set({ currentSale: sale, loading: false });
      return sale;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Inventory actions
  fetchInventory: async () => {
    set({ loading: true });
    try {
      const inventory = await fetchApi('/inventory');
      set({ inventory, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateInventory: async (id, data) => {
    try {
      const inventory = await fetchApi(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      await get().fetchInventory();
      return inventory;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  getInventoryWarnings: async () => {
    try {
      return await fetchApi('/inventory/warnings/list');
    } catch (error) {
      set({ error: error.message });
      return [];
    }
  },

  getSeasonalSuggestion: async () => {
    try {
      return await fetchApi('/inventory/seasonal-suggestion');
    } catch (error) {
      set({ error: error.message });
      return null;
    }
  },

  // Credit actions
  fetchCredits: async (filters = {}) => {
    set({ loading: true });
    try {
      const query = new URLSearchParams(filters).toString();
      const credits = await fetchApi(`/credit${query ? `?${query}` : ''}`);
      set({ credits, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  repayCredit: async (id, amount, operatorId) => {
    try {
      const credit = await fetchApi(`/credit/${id}/repay`, {
        method: 'POST',
        body: JSON.stringify({ amount, operatorId }),
      });
      await get().fetchCredits();
      return credit;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  getOverdueCredits: async () => {
    try {
      return await fetchApi('/credit/status/overdue');
    } catch (error) {
      set({ error: error.message });
      return [];
    }
  },

  checkCustomerOverdue: async (customerId) => {
    try {
      return await fetchApi(`/credit/customer/${customerId}/overdue-status`);
    } catch (error) {
      return { hasOverdue: false, count: 0, totalDue: 0 };
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
