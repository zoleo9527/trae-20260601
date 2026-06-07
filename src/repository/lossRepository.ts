import dayjs from 'dayjs';
import {
  LossRecord,
  PaginationParams,
  PaginatedResponse,
  LossFilterParams,
  LossAnalysis,
  AnalysisHistoryItem,
} from '@/types';
import { mockLossRecords } from '@/data/mockData';
import { storage } from './storage';

const STORAGE_KEY = 'loss_records';

const generateId = () => Math.random().toString(36).substring(2, 10);

const initData = (): LossRecord[] => {
  const existing = storage.get<LossRecord[] | null>(STORAGE_KEY, null);
  if (existing && existing.length > 0) {
    return existing;
  }
  storage.set(STORAGE_KEY, mockLossRecords);
  return mockLossRecords;
};

let data: LossRecord[] = initData();

const persist = () => {
  storage.set(STORAGE_KEY, data);
};

export const lossRepository = {
  findAll: async (): Promise<LossRecord[]> => {
    return [...data];
  },

  findById: async (id: string): Promise<LossRecord | undefined> => {
    return data.find((d) => d.id === id);
  },

  findPaginated: async (
    pagination: PaginationParams,
    filters?: LossFilterParams
  ): Promise<PaginatedResponse<LossRecord>> => {
    let result = [...data];

    if (filters) {
      if (filters.storeId) {
        result = result.filter((d) => d.storeId === filters.storeId);
      }
      if (filters.status) {
        result = result.filter((d) => d.status === filters.status);
      }
      if (filters.lossType) {
        result = result.filter((d) => d.lossType === filters.lossType);
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        result = result.filter(
          (d) =>
            d.productName.toLowerCase().includes(keyword) ||
            d.lossNo.toLowerCase().includes(keyword) ||
            d.storeName.toLowerCase().includes(keyword) ||
            d.sku.toLowerCase().includes(keyword) ||
            d.description.toLowerCase().includes(keyword)
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
    updates: Partial<LossRecord>
  ): Promise<LossRecord | null> => {
    const index = data.findIndex((d) => d.id === id);
    if (index === -1) return null;

    data[index] = { ...data[index], ...updates };
    persist();
    return { ...data[index] };
  },

  updateAnalysis: async (
    lossId: string,
    analysisUpdates: Partial<LossAnalysis>
  ): Promise<LossRecord | null> => {
    const index = data.findIndex((d) => d.id === lossId);
    if (index === -1) return null;

    const existingAnalysis = data[index].analysis || {
      id: generateId(),
      lossId,
      analyst: '',
      analyzedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      rootCause: '',
      preventiveMeasure: '',
      responsibleParty: '',
      conclusion: '',
      history: [],
    };

    data[index] = {
      ...data[index],
      analysis: {
        ...existingAnalysis,
        ...analysisUpdates,
      },
    };
    persist();
    return { ...data[index] };
  },

  addAnalysisHistory: async (
    lossId: string,
    operator: string,
    action: string,
    content: string
  ): Promise<void> => {
    const index = data.findIndex((d) => d.id === lossId);
    if (index === -1) return;

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const analysisId = data[index].analysis?.id || generateId();
    const historyItem: AnalysisHistoryItem = {
      id: generateId(),
      analysisId,
      timestamp: now,
      operator,
      action,
      content,
    };

    const existingAnalysis = data[index].analysis || {
      id: analysisId,
      lossId,
      analyst: operator,
      analyzedAt: now,
      rootCause: '',
      preventiveMeasure: '',
      responsibleParty: '',
      conclusion: '',
      history: [],
    };

    data[index] = {
      ...data[index],
      analysis: {
        ...existingAnalysis,
        history: [...existingAnalysis.history, historyItem],
      },
    };
    persist();
  },

  linkDifference: async (lossId: string, differenceId: string): Promise<boolean> => {
    const index = data.findIndex((d) => d.id === lossId);
    if (index === -1) return false;

    const relatedDifferenceIds = data[index].relatedDifferenceIds || [];
    if (relatedDifferenceIds.includes(differenceId)) return true;

    data[index] = {
      ...data[index],
      relatedDifferenceIds: [...relatedDifferenceIds, differenceId],
    };
    persist();
    return true;
  },

  getRelatedDifferenceIds: async (lossId: string): Promise<string[]> => {
    const loss = data.find((d) => d.id === lossId);
    return loss?.relatedDifferenceIds || [];
  },

  reset: (): void => {
    data = [...mockLossRecords];
    persist();
  },
};
