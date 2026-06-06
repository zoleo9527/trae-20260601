import axios from 'axios';
import { InventoryLockOrder, StatsSummary, OrderFilterParams } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const orderApi = {
  getAll: (role?: string, filters?: OrderFilterParams) =>
    api.get<InventoryLockOrder[]>('/orders', {
      params: { role, ...filters }
    }).then(r => r.data),

  getById: (id: string) =>
    api.get<InventoryLockOrder>(`/orders/${id}`).then(r => r.data),

  create: (data: any) =>
    api.post<InventoryLockOrder>('/orders', data).then(r => r.data),

  submitLock: (id: string, data: any) =>
    api.post<InventoryLockOrder>(`/orders/${id}/submit-lock`, data).then(r => r.data),

  review: (id: string, data: any) =>
    api.post<InventoryLockOrder>(`/orders/${id}/review`, data).then(r => r.data),

  giftConfig: (id: string, data: any) =>
    api.post<InventoryLockOrder>(`/orders/${id}/gift-config`, data).then(r => r.data),

  complete: (id: string, data: any) =>
    api.post<InventoryLockOrder>(`/orders/${id}/complete`, data).then(r => r.data),

  return: (id: string, data: any) =>
    api.post<InventoryLockOrder>(`/orders/${id}/return`, data).then(r => r.data),

  reEdit: (id: string, data: any) =>
    api.post<InventoryLockOrder>(`/orders/${id}/re-edit`, data).then(r => r.data),
};

export const statsApi = {
  getSummary: () =>
    api.get<StatsSummary>('/stats/summary').then(r => r.data)
};
