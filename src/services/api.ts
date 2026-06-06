import type {
  LiveSchedule,
  Product,
  WorkflowRecord,
  ScheduleProduct,
} from '@/types';

const API_BASE = '/api';

interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
  total?: number;
  idempotencyKey?: string;
  isDuplicate?: boolean;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  const result = await response.json();
  if (result.code !== 0) {
    throw new Error(result.message || '请求失败');
  }

  return result;
}

export const scheduleApi = {
  getList: (): Promise<ApiResponse<LiveSchedule[]>> =>
    request('/schedules'),

  getDetail: (id: string): Promise<ApiResponse<LiveSchedule & { history: WorkflowRecord[] }>> =>
    request(`/schedules/${id}`),

  getHistory: (id: string): Promise<ApiResponse<WorkflowRecord[]>> =>
    request(`/schedules/${id}/history`),

  create: (data: Partial<LiveSchedule> & { userId?: string; products?: ScheduleProduct[] }): Promise<ApiResponse<LiveSchedule>> =>
    request('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: Partial<LiveSchedule> & { idempotencyKey?: string; userId?: string },
  ): Promise<ApiResponse<LiveSchedule>> =>
    request(`/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  submitForReview: (
    id: string,
    data: { remark: string; idempotencyKey?: string; userId?: string },
  ): Promise<ApiResponse<LiveSchedule>> =>
    request(`/schedules/${id}/submit`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  approve: (
    id: string,
    data: { remark?: string; idempotencyKey?: string; userId?: string },
  ): Promise<ApiResponse<LiveSchedule>> =>
    request(`/schedules/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  return: (
    id: string,
    data: { remark: string; idempotencyKey?: string; userId?: string },
  ): Promise<ApiResponse<LiveSchedule>> =>
    request(`/schedules/${id}/return`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  supplement: (
    id: string,
    data: Partial<LiveSchedule> & { remark: string; idempotencyKey?: string; userId?: string },
  ): Promise<ApiResponse<LiveSchedule>> =>
    request(`/schedules/${id}/supplement`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  startLive: (
    id: string,
    data: { idempotencyKey?: string; userId?: string } = {},
  ): Promise<ApiResponse<LiveSchedule>> =>
    request(`/schedules/${id}/start-live`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  endLive: (
    id: string,
    data: { idempotencyKey?: string; userId?: string } = {},
  ): Promise<ApiResponse<LiveSchedule>> =>
    request(`/schedules/${id}/end-live`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancel: (
    id: string,
    data: { remark: string; idempotencyKey?: string; userId?: string },
  ): Promise<ApiResponse<LiveSchedule>> =>
    request(`/schedules/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const productApi = {
  getList: (): Promise<ApiResponse<Product[]>> =>
    request('/products'),

  getDetail: (id: string): Promise<ApiResponse<Product & { history: WorkflowRecord[] }>> =>
    request(`/products/${id}`),

  getHistory: (id: string): Promise<ApiResponse<WorkflowRecord[]>> =>
    request(`/products/${id}/history`),

  create: (data: Partial<Product> & { userId?: string }): Promise<ApiResponse<Product>> =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  approve: (
    id: string,
    data: { idempotencyKey?: string; userId?: string } = {},
  ): Promise<ApiResponse<Product>> =>
    request(`/products/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  reject: (
    id: string,
    data: { remark: string; idempotencyKey?: string; userId?: string },
  ): Promise<ApiResponse<Product>> =>
    request(`/products/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const workflowApi = {
  getRecords: (params?: { bizType?: string; bizId?: string }): Promise<ApiResponse<WorkflowRecord[]>> => {
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
    return request(`/workflow/records${query}`);
  },
};

export const statsApi = {
  getOverview: (): Promise<ApiResponse<{
    schedules: Record<string, number>;
    products: Record<string, number>;
  }>> =>
    request('/stats/overview'),
};
