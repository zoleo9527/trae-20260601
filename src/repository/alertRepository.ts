import dayjs from 'dayjs';
import {
  Alert,
  PaginationParams,
  PaginatedResponse,
  AlertFilterParams,
} from '@/types';
import { mockAlerts } from '@/data/mockData';
import { storage } from './storage';

const STORAGE_KEY = 'alerts';

const initData = (): Alert[] => {
  const existing = storage.get<Alert[] | null>(STORAGE_KEY, null);
  if (existing && existing.length > 0) {
    return existing;
  }
  storage.set(STORAGE_KEY, mockAlerts);
  return mockAlerts;
};

let data: Alert[] = initData();

const persist = () => {
  storage.set(STORAGE_KEY, data);
};

export const alertRepository = {
  findAll: async (): Promise<Alert[]> => {
    return [...data];
  },

  findById: async (id: string): Promise<Alert | undefined> => {
    return data.find((d) => d.id === id);
  },

  findActive: async (): Promise<Alert[]> => {
    return data.filter((a) => a.status === 'active' || a.status === 'processing');
  },

  findPaginated: async (
    pagination: PaginationParams,
    filters?: AlertFilterParams
  ): Promise<PaginatedResponse<Alert>> => {
    let result = [...data];

    if (filters) {
      if (filters.storeId) {
        result = result.filter((d) => d.storeId === filters.storeId);
      }
      if (filters.status) {
        result = result.filter((d) => d.status === filters.status);
      }
      if (filters.alertType) {
        result = result.filter((d) => d.alertType === filters.alertType);
      }
      if (filters.severity) {
        result = result.filter((d) => d.severity === filters.severity);
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        result = result.filter(
          (d) =>
            d.title.toLowerCase().includes(keyword) ||
            d.description.toLowerCase().includes(keyword) ||
            d.alertNo.toLowerCase().includes(keyword) ||
            d.storeName.toLowerCase().includes(keyword) ||
            (d.productName && d.productName.toLowerCase().includes(keyword)) ||
            (d.sku && d.sku.toLowerCase().includes(keyword))
        );
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        result = result.filter(
          (d) =>
            dayjs(d.createdAt).isAfter(dayjs(start).startOf('day')) &&
            dayjs(d.createdAt).isBefore(dayjs(end).endOf('day'))
        );
      }
    }

    result.sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const statusOrder: Record<string, number> = { active: 0, processing: 1, resolved: 2, ignored: 3 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const total = result.length;
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const paginatedData = result.slice(startIndex, startIndex + pagination.pageSize);

    return {
      data: paginatedData,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
    };
  },

  update: async (
    id: string,
    updates: Partial<Alert>
  ): Promise<Alert | null> => {
    const index = data.findIndex((d) => d.id === id);
    if (index === -1) return null;

    data[index] = { ...data[index], ...updates };
    persist();
    return { ...data[index] };
  },

  reset: (): void => {
    data = [...mockAlerts];
    persist();
  },
};
