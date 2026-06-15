import type { Order, Statistics } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const orderApi = {
  getOrders: (params?: { status?: string; role?: string; urgent?: string }) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<Order[]>(`/orders${query}`);
  },

  getOrder: (id: string) => {
    return request<Order>(`/orders/${id}`);
  },

  createOrder: (data: Partial<Order>) => {
    return request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateOrder: (id: string, data: Partial<Order>) => {
    return request<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateStatus: (id: string, status: string, operator: string, remark?: string) => {
    return request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, operator, remark }),
    });
  },

  addRevision: (id: string, data: {
    type: string;
    description: string;
    operator: string;
    file?: File;
    beforeData: Record<string, any>;
    afterData: Record<string, any>;
  }) => {
    const formData = new FormData();
    formData.append('type', data.type);
    formData.append('description', data.description);
    formData.append('operator', data.operator);
    formData.append('beforeData', JSON.stringify(data.beforeData));
    formData.append('afterData', JSON.stringify(data.afterData));
    if (data.file) {
      formData.append('file', data.file);
    }
    
    return request<Order>(`/orders/${id}/revisions`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  addInstallation: (id: string, data: {
    installTime: string;
    operator: string;
    remark: string;
    photos: File[];
    issueReported: boolean;
  }) => {
    const formData = new FormData();
    formData.append('installTime', data.installTime);
    formData.append('operator', data.operator);
    formData.append('remark', data.remark);
    formData.append('issueReported', String(data.issueReported));
    data.photos.forEach(photo => {
      formData.append('photos', photo);
    });
    
    return request<Order>(`/orders/${id}/installation`, {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  confirmByCustomer: (id: string, data: {
    customerName: string;
    signature: string;
    confirmType: 'approve' | 'revise';
    feedback: string;
  }) => {
    return request<Order>(`/orders/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  batchUpdateStatus: (ids: string[], status: string, operator: string, remark?: string) => {
    return request<{ updated: number; ids: string[] }>('/batch/status', {
      method: 'POST',
      body: JSON.stringify({ ids, status, operator, remark }),
    });
  },

  resetData: () => {
    return request<{ message: string }>('/reset', {
      method: 'POST',
    });
  },

  getStatistics: () => {
    return request<Statistics>('/statistics');
  },
};
