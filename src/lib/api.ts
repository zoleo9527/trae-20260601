import type { ApiResponse } from '@shared/types';

const BASE_URL = '/api';

function getHeaders(): Record<string, string> {
  const role = localStorage.getItem('user_role');
  const username = localStorage.getItem('user_username');
  return {
    'Content-Type': 'application/json',
    ...(role ? { 'x-user-role': role } : {}),
    ...(username ? { 'x-user-username': username } : {}),
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        ...getHeaders(),
        ...(options.headers || {}),
      },
    });
    const data = (await res.json()) as ApiResponse<T>;
    return data;
  } catch (_e) {
    return {
      code: 50001,
      message: '网络请求失败',
      data: null,
    };
  }
}

export const api = {
  login: (role: string) =>
    request<{ id: string; name: string; role: string; username: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getUsers: () =>
    request<Array<{ id: string; name: string; role: string; username: string }>>('/auth/users'),

  getDashboard: () =>
    request<{
      pendingCount: number;
      exceptionCount: number;
      completedCount: number;
      pendingList: unknown[];
      exceptionList: unknown[];
      completedList: unknown[];
    }>('/dashboard'),

  listOrders: (status?: string) =>
    request<unknown[]>(`/orders${status ? `?status=${status}` : ''}`),

  getOrder: (id: string) => request<unknown>(`/orders/${id}`),

  getQuoteDetail: (id: string) =>
    request<{ order: unknown; history: unknown[] }>(`/orders/${id}/quote`),

  getOrderHistory: (id: string) => request<unknown[]>(`/orders/${id}/history`),

  claimSelection: (id: string) =>
    request<unknown>(`/orders/${id}/selection/claim`, { method: 'POST' }),

  submitSelection: (id: string, payload: { tireSpecs: unknown[]; basis: string[] }) =>
    request<unknown>(`/orders/${id}/selection`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  processQuote: (
    id: string,
    payload: { action: 'confirm' | 'reject'; rejectReason?: string },
  ) =>
    request<unknown>(`/orders/${id}/quote`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
