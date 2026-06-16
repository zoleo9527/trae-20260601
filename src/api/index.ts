import type { OutOfStockRecord, ReplenishOrder, OperationLog, OutOfStockQueryParams, ReplenishQueryParams } from '@/types';

const BASE_URL = 'http://localhost:3001/api';

export const outOfStockApi = {
  list: async (params?: OutOfStockQueryParams): Promise<OutOfStockRecord[]> => {
    const url = new URL(`${BASE_URL}/out-of-stock`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, String(value));
      });
    }
    const response = await fetch(url.toString());
    return response.json();
  },

  getById: async (id: string): Promise<OutOfStockRecord | null> => {
    const response = await fetch(`${BASE_URL}/out-of-stock/${id}`);
    if (!response.ok) return null;
    return response.json();
  },

  create: async (data: {
    dishId: string;
    dishName: string;
    storeId: string;
    storeName: string;
    region: string;
    quantity: number;
    reason: string;
    remark: string;
    submitterId: string;
    submitterName: string;
  }): Promise<OutOfStockRecord> => {
    const response = await fetch(`${BASE_URL}/out-of-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  approve: async (id: string, approverId: string, approverName: string): Promise<{ status: string; approverId: string; approverName: string; approveTime: string }> => {
    const response = await fetch(`${BASE_URL}/out-of-stock/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverId, approverName }),
    });
    return response.json();
  },

  reject: async (id: string, approverId: string, approverName: string, rejectReason: string): Promise<{ status: string; approverId: string; approverName: string; approveTime: string; rejectReason: string }> => {
    const response = await fetch(`${BASE_URL}/out-of-stock/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverId, approverName, rejectReason }),
    });
    return response.json();
  },

  close: async (id: string): Promise<{ status: string; closeTime: string }> => {
    const response = await fetch(`${BASE_URL}/out-of-stock/${id}/close`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },
};

export const replenishApi = {
  list: async (params?: ReplenishQueryParams): Promise<ReplenishOrder[]> => {
    const url = new URL(`${BASE_URL}/replenish`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, String(value));
      });
    }
    const response = await fetch(url.toString());
    return response.json();
  },

  getById: async (id: string): Promise<ReplenishOrder | null> => {
    const response = await fetch(`${BASE_URL}/replenish/${id}`);
    if (!response.ok) return null;
    return response.json();
  },

  create: async (data: {
    outOfStockId: string;
    dishId: string;
    dishName: string;
    storeId: string;
    storeName: string;
    region: string;
    requestedQuantity: number;
    remark: string;
    submitterId: string;
    submitterName: string;
  }): Promise<ReplenishOrder> => {
    const response = await fetch(`${BASE_URL}/replenish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  confirm: async (id: string, confirmerId: string, confirmerName: string): Promise<{ status: string; confirmerId: string; confirmerName: string; confirmTime: string }> => {
    const response = await fetch(`${BASE_URL}/replenish/${id}/confirm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmerId, confirmerName }),
    });
    return response.json();
  },

  complete: async (id: string): Promise<{ status: string; completionTime: string }> => {
    const response = await fetch(`${BASE_URL}/replenish/${id}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.json();
  },

  cancel: async (id: string, cancelReason: string): Promise<{ status: string; cancelReason: string }> => {
    const response = await fetch(`${BASE_URL}/replenish/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancelReason }),
    });
    return response.json();
  },
};

export const operationLogApi = {
  list: async (): Promise<OperationLog[]> => {
    const response = await fetch(`${BASE_URL}/logs`);
    return response.json();
  },
};

export const storesApi = {
  list: async (): Promise<{ id: string; name: string; region: string }[]> => {
    const response = await fetch(`${BASE_URL}/stores`);
    return response.json();
  },
};

export const dishesApi = {
  list: async (): Promise<{ id: string; name: string; category: string; unit: string; price: number; stock: number; safetyStock: number }[]> => {
    const response = await fetch(`${BASE_URL}/dishes`);
    return response.json();
  },
};
