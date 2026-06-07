import request from './request';
import {
  InventoryDifference,
  LossRecord,
  Alert,
  PaginationParams,
  PaginatedResponse,
  DifferenceFilterParams,
  LossFilterParams,
  AlertFilterParams,
} from '@/types';

const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        searchParams.append(key, value.join(','));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const differenceApi = {
  getList: (
    pagination: PaginationParams,
    filters?: DifferenceFilterParams
  ): Promise<PaginatedResponse<InventoryDifference>> => {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters,
    };
    return request.get(`/differences${buildQueryParams(params)}`);
  },

  getById: (id: string): Promise<InventoryDifference> => {
    return request.get(`/differences/${id}`);
  },

  updateStatus: (
    id: string,
    data: {
      status: string;
      remark?: string;
      relatedLossId?: string;
    }
  ): Promise<InventoryDifference> => {
    return request.put(`/differences/${id}/status`, data);
  },
};

export const lossApi = {
  getList: (
    pagination: PaginationParams,
    filters?: LossFilterParams
  ): Promise<PaginatedResponse<LossRecord>> => {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters,
    };
    return request.get(`/losses${buildQueryParams(params)}`);
  },

  getById: (id: string): Promise<LossRecord> => {
    return request.get(`/losses/${id}`);
  },

  updateStatus: (
    id: string,
    data: {
      status: string;
      rootCause?: string;
      preventiveMeasure?: string;
      responsibleParty?: string;
      conclusion?: string;
      relatedDifferenceId?: string;
    }
  ): Promise<LossRecord> => {
    return request.put(`/losses/${id}/status`, data);
  },
};

export const alertApi = {
  getList: (
    pagination: PaginationParams,
    filters?: AlertFilterParams
  ): Promise<PaginatedResponse<Alert>> => {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filters,
    };
    return request.get(`/alerts${buildQueryParams(params)}`);
  },

  getActive: (): Promise<Alert[]> => {
    return request.get('/alerts/active');
  },

  updateStatus: (
    id: string,
    data: {
      status: string;
      resolution?: string;
    }
  ): Promise<Alert> => {
    return request.put(`/alerts/${id}/status`, data);
  },
};

export const dashboardApi = {
  getStats: (): Promise<{
    totalDifferences: number;
    pendingDifferences: number;
    totalLoss: number;
    activeAlerts: number;
    criticalAlerts: number;
  }> => {
    return request.get('/dashboard/stats');
  },

  getLossTrend: (): Promise<Array<{ date: string; amount: number; count: number }>> => {
    return request.get('/dashboard/loss-trend');
  },

  getLossTypeDistribution: (): Promise<Array<{ type: string; value: number; name: string }>> => {
    return request.get('/dashboard/loss-type-distribution');
  },

  getDifferenceTypeDistribution: (): Promise<
    Array<{ type: string; value: number; name: string }>
  > => {
    return request.get('/dashboard/difference-type-distribution');
  },
};
