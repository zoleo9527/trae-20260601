import axios from 'axios';
import {
  User,
  DemoAccount,
  Property,
  ViewingRecord,
  Quotation,
  Contract,
  HandoverForm,
  DepositRecord,
  OperationLog,
  TimelineEvent,
  StatusTransition,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { username, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get<User>('/auth/me'),
  getDemoAccounts: () => api.get<DemoAccount[]>('/auth/demo-accounts'),
};

export const propertyAPI = {
  list: (params?: { building?: string; status?: string; floor?: string }) =>
    api.get<Property[]>('/properties', { params }),
  get: (id: string) => api.get<Property & { logs: OperationLog[] }>(`/properties/${id}`),
  create: (data: Partial<Property>) => api.post<Property>('/properties', data),
  update: (id: string, data: Partial<Property>) => api.put<Property>(`/properties/${id}`, data),
  transition: (id: string, toStatus: string, remark?: string) =>
    api.post<Property>(`/properties/${id}/transition`, { toStatus, remark }),
  getAvailableTransitions: (id: string) =>
    api.get<StatusTransition[]>(`/properties/${id}/available-transitions`),
  getRelated: (id: string) =>
    api.get<{
      viewings: ViewingRecord[];
      quotations: Quotation[];
      contracts: Contract[];
      handovers: HandoverForm[];
      deposits: DepositRecord[];
    }>(`/properties/${id}/related`),
  getStatistics: () =>
    api.get<{
      total: number;
      totalArea: number;
      occupiedArea: number;
      occupancyRate: number;
      statusCounts: Record<string, number>;
    }>('/properties/statistics/summary'),
};

export const viewingAPI = {
  list: (params?: { propertyId?: string; status?: string }) =>
    api.get<ViewingRecord[]>('/viewings', { params }),
  get: (id: string) =>
    api.get<ViewingRecord & { property: Property; logs: OperationLog[] }>(`/viewings/${id}`),
  create: (data: Partial<ViewingRecord>) => api.post<ViewingRecord>('/viewings', data),
  update: (id: string, data: Partial<ViewingRecord>) =>
    api.put<ViewingRecord>(`/viewings/${id}`, data),
  complete: (id: string, data: { feedback: string; interestLevel: string; nextFollowUp?: string }) =>
    api.post<ViewingRecord>(`/viewings/${id}/complete`, data),
  cancel: (id: string, reason?: string) =>
    api.post<ViewingRecord>(`/viewings/${id}/cancel`, { reason }),
};

export const quotationAPI = {
  list: (params?: { propertyId?: string; status?: string }) =>
    api.get<Quotation[]>('/quotations', { params }),
  get: (id: string) =>
    api.get<
      Quotation & { property: Property; viewing?: ViewingRecord; logs: OperationLog[] }
    >(`/quotations/${id}`),
  create: (data: Partial<Quotation>) => api.post<Quotation>('/quotations', data),
  update: (id: string, data: Partial<Quotation>) =>
    api.put<Quotation>(`/quotations/${id}`, data),
  submit: (id: string) => api.post<Quotation>(`/quotations/${id}/submit`),
  approve: (id: string, approvalComment?: string) =>
    api.post<Quotation>(`/quotations/${id}/approve`, { approvalComment }),
  reject: (id: string, approvalComment: string) =>
    api.post<Quotation>(`/quotations/${id}/reject`, { approvalComment }),
};

export const contractAPI = {
  list: (params?: { propertyId?: string; status?: string }) =>
    api.get<Contract[]>('/contracts', { params }),
  get: (id: string) =>
    api.get<
      Contract & { property: Property; quotation?: Quotation; logs: OperationLog[] }
    >(`/contracts/${id}`),
  create: (data: Partial<Contract>) => api.post<Contract>('/contracts', data),
  update: (id: string, data: Partial<Contract>) =>
    api.put<Contract>(`/contracts/${id}`, data),
  submitReview: (id: string) => api.post<Contract>(`/contracts/${id}/submit-review`),
  approve: (id: string, reviewComment?: string) =>
    api.post<Contract>(`/contracts/${id}/approve`, { reviewComment }),
  reject: (id: string, reviewComment: string) =>
    api.post<Contract>(`/contracts/${id}/reject`, { reviewComment }),
  sign: (id: string, data: { signatoryPartyA: string; signatoryPartyB: string }) =>
    api.post<Contract>(`/contracts/${id}/sign`, data),
};

export const handoverAPI = {
  list: (params?: { propertyId?: string; contractId?: string; status?: string; type?: string }) =>
    api.get<HandoverForm[]>('/handover', { params }),
  get: (id: string) =>
    api.get<
      HandoverForm & { property: Property; contract: Contract; logs: OperationLog[] }
    >(`/handover/${id}`),
  create: (data: Partial<HandoverForm>) => api.post<HandoverForm>('/handover', data),
  update: (id: string, data: Partial<HandoverForm>) =>
    api.put<HandoverForm>(`/handover/${id}`, data),
  signReceiver: (id: string, receiverName: string) =>
    api.post<HandoverForm>(`/handover/${id}/sign-receiver`, { receiverName }),
  complete: (id: string, data: { delivererName?: string; disputes?: string }) =>
    api.post<HandoverForm>(`/handover/${id}/complete`, data),
};

export const depositAPI = {
  list: (params?: { propertyId?: string; contractId?: string; status?: string; type?: string }) =>
    api.get<DepositRecord[]>('/deposits', { params }),
  get: (id: string) =>
    api.get<
      DepositRecord & { property: Property; contract: Contract; logs: OperationLog[] }
    >(`/deposits/${id}`),
  create: (data: Partial<DepositRecord>) => api.post<DepositRecord>('/deposits', data),
  confirmPayment: (id: string) => api.post<DepositRecord>(`/deposits/${id}/confirm-payment`),
  startRefund: (id: string, refundAmount?: number) =>
    api.post<DepositRecord>(`/deposits/${id}/start-refund`, { refundAmount }),
  confirmRefund: (id: string) => api.post<DepositRecord>(`/deposits/${id}/confirm-refund`),
  deduct: (id: string, data: { deductionReason: string; deductionAmount: number; refundAmount?: number }) =>
    api.post<DepositRecord>(`/deposits/${id}/deduct`, data),
  dispute: (id: string, disputes: string) =>
    api.post<DepositRecord>(`/deposits/${id}/dispute`, { disputes }),
  getStatistics: () =>
    api.get<{
      total: number;
      totalUnpaid: number;
      totalPaid: number;
      totalRefunding: number;
      totalRefunded: number;
      totalDeducted: number;
      totalDisputed: number;
    }>('/deposits/statistics/summary'),
};

export const logsAPI = {
  list: (params?: {
    entityType?: string;
    entityId?: string;
    operatorId?: string;
    action?: string;
    page?: number;
    pageSize?: number;
  }) =>
    api.get<{
      list: OperationLog[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>('/logs', { params }),
  getEntityLogs: (entityType: string, entityId: string) =>
    api.get<OperationLog[]>(`/logs/entity/${entityType}/${entityId}`),
  getTimeline: (entityType: string, entityId: string) =>
    api.get<TimelineEvent[]>(`/logs/timeline/${entityType}/${entityId}`),
};

export default api;
