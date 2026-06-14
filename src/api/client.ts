import { useAuthStore } from '../stores/authStore';

const API_BASE = '/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const token = useAuthStore.getState().token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }));
      throw new Error(error.error || '请求失败');
    }
    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${API_BASE}${endpoint}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }
}

export const api = new ApiClient();

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ user: any; token: string }>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
};

export const todoApi = {
  getTodos: () => api.get<{ todos: any[]; total: number; role: string }>('/todos'),
};

export const trainingApi = {
  getAll: (params?: any) => api.get('/training', params),
  getById: (id: string) => api.get<{ training: any }>(`/training/${id}`),
  confirm: (id: string, data: any) => api.post(`/training/${id}/confirm`, data),
  markException: (id: string, data: any) => api.post(`/training/${id}/exception`, data),
};

export const paymentApi = {
  getAll: (params?: any) => api.get('/payments', params),
  getByStudent: (studentId: string) =>
    api.get<{ payments: any[]; summary: any }>(`/payments/student/${studentId}`),
  getById: (id: string) => api.get<{ payment: any }>(`/payments/${id}`),
  settle: (id: string, data: any) => api.post(`/payments/${id}/settle`, data),
};

export const examApi = {
  getAll: (params?: any) => api.get('/exams', params),
  getById: (id: string) => api.get<{ exam: any }>(`/exams/${id}`),
  book: (id: string, data: any) => api.post(`/exams/${id}/book`, data),
  score: (id: string, data: any) => api.post(`/exams/${id}/score`, data),
};

export const studentApi = {
  getAll: (params?: any) => api.get<{ students: any[] }>('/students', params),
  getById: (id: string) => api.get<{ student: any; statusLogs: any[] }>(`/students/${id}`),
};

export const statusLogApi = {
  getByEntity: (entityType: string, entityId: string) =>
    api.get<{ logs: any[] }>(`/status-logs/${entityType}/${entityId}`),
};
