import dayjs from 'dayjs';
import {
  InventoryDifference,
  PaginationParams,
  PaginatedResponse,
  DifferenceFilterParams,
  DifferenceHistoryItem,
} from '@/types';
import { mockInventoryDifferences } from '@/data/mockData';
import { storage } from './storage';

const STORAGE_KEY = 'inventory_differences';

const generateId = () => Math.random().toString(36).substring(2, 10);

const initData = (): InventoryDifference[] => {
  const existing = storage.get<InventoryDifference[] | null>(STORAGE_KEY, null);
  if (existing && existing.length > 0) {
    return existing;
  }
  storage.set(STORAGE_KEY, mockInventoryDifferences);
  return mockInventoryDifferences;
};

let data: InventoryDifference[] = initData();

const persist = () => {
  storage.set(STORAGE_KEY, data);
};

export const differenceRepository = {
  findAll: async (): Promise<InventoryDifference[]> => {
    return [...data];
  },

  findById: async (id: string): Promise<InventoryDifference | undefined> => {
    return data.find((d) => d.id === id);
  },

  findPaginated: async (
    pagination: PaginationParams,
    filters?: DifferenceFilterParams
  ): Promise<PaginatedResponse<InventoryDifference>> => {
    let result = [...data];

    if (filters) {
      if (filters.storeId) {
        result = result.filter((d) => d.storeId === filters.storeId);
      }
      if (filters.status) {
        result = result.filter((d) => d.status === filters.status);
      }
      if (filters.differenceType) {
        result = result.filter((d) => d.differenceType === filters.differenceType);
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        result = result.filter(
          (d) =>
            d.productName.toLowerCase().includes(keyword) ||
            d.differenceNo.toLowerCase().includes(keyword) ||
            d.storeName.toLowerCase().includes(keyword) ||
            d.sku.toLowerCase().includes(keyword)
        );
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        result = result.filter(
          (d) =>
            dayjs(d.reportedAt).isAfter(dayjs(start).startOf('day')) &&
            dayjs(d.reportedAt).isBefore(dayjs(end).endOf('day'))
        );
      }
    }

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
    updates: Partial<InventoryDifference>
  ): Promise<InventoryDifference | null> => {
    const index = data.findIndex((d) => d.id === id);
    if (index === -1) return null;

    data[index] = { ...data[index], ...updates };
    persist();
    return { ...data[index] };
  },

  addHistory: async (
    differenceId: string,
    operator: string,
    action: string,
    content: string
  ): Promise<void> => {
    const index = data.findIndex((d) => d.id === differenceId);
    if (index === -1) return;

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const historyItem: DifferenceHistoryItem = {
      id: generateId(),
      differenceId,
      timestamp: now,
      operator,
      action,
      content,
    };

    data[index] = {
      ...data[index],
      history: [...data[index].history, historyItem],
    };
    persist();
  },

  linkLossRecord: async (differenceId: string, lossId: string): Promise<boolean> => {
    const index = data.findIndex((d) => d.id === differenceId);
    if (index === -1) return false;

    const relatedLossIds = data[index].relatedLossIds || [];
    if (relatedLossIds.includes(lossId)) return true;

    data[index] = {
      ...data[index],
      relatedLossIds: [...relatedLossIds, lossId],
    };
    persist();
    return true;
  },

  getRelatedLossIds: async (differenceId: string): Promise<string[]> => {
    const diff = data.find((d) => d.id === differenceId);
    return diff?.relatedLossIds || [];
  },

  reset: (): void => {
    data = [...mockInventoryDifferences];
    persist();
  },
};
