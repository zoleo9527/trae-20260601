import { api } from './client';
import type {
  DashboardData,
  Order,
  PackagingBatch,
  LoadingBatch,
  OperationLog,
  InspectionResult,
} from '../../shared/types.js';

export const dashboardApi = {
  getDashboard: () => api.get<DashboardData>('/dashboard'),
};

export const ordersApi = {
  getOrders: (status?: string) =>
    api.get<Order[]>('/orders', status ? { status } : undefined),
  getOrder: (id: string) => api.get<Order>(`/orders/${id}`),
  updateSpec: (id: string, spec: string, quantity?: number, operator?: string) =>
    api.put<Order>(`/orders/${id}/spec`, { spec, quantity, operator }),
  updateBloom: (id: string, bloomForecast: string, operator?: string) =>
    api.put<Order>(`/orders/${id}/bloom`, { bloomForecast, operator }),
};

export const packagingApi = {
  getBatches: (status?: string) =>
    api.get<PackagingBatch[]>('/packaging/batches', status ? { status } : undefined),
  getBatch: (id: string) => api.get<PackagingBatch>(`/packaging/batches/${id}`),
  submitInspection: (
    batchId: string,
    data: {
      qualifiedQty: number;
      damagedQty: number;
      damageReasons: string[];
      remark?: string;
      inspector?: string;
    },
  ) =>
    api.post<{ batch: PackagingBatch; result: InspectionResult }>(
      `/packaging/batches/${batchId}/inspect`,
      data,
    ),
  updateInspection: (
    batchId: string,
    data: {
      qualifiedQty: number;
      damagedQty: number;
      damageReasons: string[];
      remark?: string;
      inspector?: string;
    },
  ) =>
    api.put<{ batch: PackagingBatch; result: InspectionResult }>(
      `/packaging/inspections/${batchId}`,
      data,
    ),
};

export const loadingApi = {
  getBatches: (status?: string) =>
    api.get<LoadingBatch[]>('/loading/batches', status ? { status } : undefined),
  getBatch: (id: string) => api.get<LoadingBatch>(`/loading/batches/${id}`),
  confirm: (id: string, confirmer?: string, confirmed: boolean = true) =>
    api.post<LoadingBatch>(`/loading/batches/${id}/confirm`, { confirmer, confirmed }),
};

export const logsApi = {
  getLogs: (params?: { role?: string; action?: string; targetType?: string; limit?: number }) =>
    api.get<OperationLog[]>('/logs', params),
};

export const resetApi = {
  reset: () => api.post<{ message: string }>('/reset'),
};
