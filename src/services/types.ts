import {
  InventoryDifference,
  LossRecord,
  Alert,
  PaginatedResponse,
  PaginationParams,
  DifferenceFilterParams,
  LossFilterParams,
  AlertFilterParams,
  InventoryDifferenceStatus,
  LossAnalysisStatus,
  AlertStatus,
} from '@/types';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UpdateDifferenceStatusRequest {
  status: InventoryDifferenceStatus;
  remark?: string;
  relatedLossId?: string;
}

export interface UpdateLossStatusRequest {
  status: LossAnalysisStatus;
  rootCause?: string;
  preventiveMeasure?: string;
  responsibleParty?: string;
  conclusion?: string;
  relatedDifferenceId?: string;
}

export interface UpdateAlertStatusRequest {
  status: AlertStatus;
  resolution?: string;
}

export interface IDifferenceApi {
  getList: (
    pagination: PaginationParams,
    filters?: DifferenceFilterParams
  ) => Promise<ApiResponse<PaginatedResponse<InventoryDifference>>>;
  getById: (id: string) => Promise<ApiResponse<InventoryDifference>>;
  updateStatus: (
    id: string,
    request: UpdateDifferenceStatusRequest
  ) => Promise<ApiResponse<InventoryDifference>>;
  linkLossRecord: (
    differenceId: string,
    lossId: string
  ) => Promise<ApiResponse<InventoryDifference>>;
}

export interface ILossApi {
  getList: (
    pagination: PaginationParams,
    filters?: LossFilterParams
  ) => Promise<ApiResponse<PaginatedResponse<LossRecord>>>;
  getById: (id: string) => Promise<ApiResponse<LossRecord>>;
  updateStatus: (
    id: string,
    request: UpdateLossStatusRequest
  ) => Promise<ApiResponse<LossRecord>>;
  linkDifference: (
    lossId: string,
    differenceId: string
  ) => Promise<ApiResponse<LossRecord>>;
}

export interface IAlertApi {
  getList: (
    pagination: PaginationParams,
    filters?: AlertFilterParams
  ) => Promise<ApiResponse<PaginatedResponse<Alert>>>;
  getActive: () => Promise<ApiResponse<Alert[]>>;
  updateStatus: (
    id: string,
    request: UpdateAlertStatusRequest
  ) => Promise<ApiResponse<Alert>>;
}

export interface IDashboardApi {
  getStats: () => Promise<ApiResponse<{
    totalDifferences: number;
    pendingDifferences: number;
    totalLoss: number;
    activeAlerts: number;
    criticalAlerts: number;
  }>>;
  getLossTrend: () => Promise<ApiResponse<Array<{ date: string; amount: number; count: number }>>>;
  getLossTypeDistribution: () => Promise<ApiResponse<Array<{ type: string; value: number; name: string }>>>;
  getDifferenceTypeDistribution: () => Promise<ApiResponse<Array<{ type: string; value: number; name: string }>>>;
}
