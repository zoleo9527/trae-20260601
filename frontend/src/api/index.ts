const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...headers,
        ...options?.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return { success: false, error: '网络错误' };
  }
}

export const api = {
  users: {
    login: (username: string, password: string, role: string) =>
      request('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password, role }),
      }),

    me: () => request('/users/me'),

    list: () => request('/users'),
  },

  customers: {
    list: () => request('/customers'),

    get: (id: number) => request(`/customers/${id}`),

    create: (data: any) =>
      request('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: any) =>
      request(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request(`/customers/${id}`, {
        method: 'DELETE',
      }),

    getDocuments: (customerId: number) =>
      request(`/customers/${customerId}/documents`),

    addDocument: (customerId: number, data: any) =>
      request(`/customers/${customerId}/documents`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  documents: {
    update: (id: number, data: any) =>
      request(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: number) =>
      request(`/documents/${id}`, {
        method: 'DELETE',
      }),
  },

  dueDiligence: {
    list: () => request('/due-diligence'),

    get: (id: number) => request(`/due-diligence/${id}`),

    create: (data: any) =>
      request('/due-diligence', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: number, data: any) =>
      request(`/due-diligence/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    addAttachment: (id: number, data: any) =>
      request(`/due-diligence/${id}/attachments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getHistory: (id: number) => request(`/due-diligence/${id}/history`),
  },

  handoffs: {
    list: () => request('/handoffs'),

    get: (id: number) => request(`/handoffs/${id}`),

    create: (data: any) =>
      request('/handoffs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    confirm: (id: number) =>
      request(`/handoffs/${id}/confirm`, {
        method: 'PUT',
      }),

    getPending: () => request('/handoffs/pending'),
  },

  notifications: {
    list: () => request('/notifications'),

    markRead: (id: number) =>
      request(`/notifications/${id}/read`, {
        method: 'PUT',
      }),

    markAllRead: () =>
      request('/notifications/read-all', {
        method: 'PUT',
      }),
  },
};
