import axios from 'axios';
import type {
  Inspection,
  Dispatch,
  User,
  RectificationStats,
  CreateInspectionRequest,
  CreateDispatchRequest,
  UpdateDispatchRequest,
  ReviewRequest,
  RiskLevel,
  InspectionStatus
} from '../../shared/types.js';

const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const inspectionApi = {
  getInspections: (filters?: {
    riskLevel?: RiskLevel;
    status?: InspectionStatus;
    facilityType?: string;
  }): Promise<Inspection[]> => {
    return apiClient.get('/inspections', { params: filters }).then(res => res.data);
  },

  getInspectionById: (id: string): Promise<Inspection> => {
    return apiClient.get(`/inspections/${id}`).then(res => res.data);
  },

  createInspection: (data: CreateInspectionRequest): Promise<Inspection> => {
    return apiClient.post('/inspections', data, {
      headers: { 'X-User-Id': 'u001' }
    }).then(res => res.data);
  },

  updateStatus: (id: string, status: InspectionStatus, remark?: string): Promise<Inspection> => {
    return apiClient.patch(`/inspections/${id}/status`, { status, remark }, {
      headers: { 'X-User-Id': 'u002' }
    }).then(res => res.data);
  },

  getPendingReviews: (): Promise<Inspection[]> => {
    return apiClient.get('/rectification/reviews/pending').then(res => res.data);
  }
};

export const dispatchApi = {
  getAllDispatches: (): Promise<Dispatch[]> => {
    return apiClient.get('/dispatches').then(res => res.data);
  },

  createDispatch: (data: CreateDispatchRequest): Promise<Dispatch> => {
    return apiClient.post('/dispatches', data, {
      headers: { 'X-User-Id': 'u002' }
    }).then(res => res.data);
  },

  updateDispatch: (id: string, data: UpdateDispatchRequest): Promise<Dispatch> => {
    return apiClient.put(`/dispatches/${id}`, data, {
      headers: { 'X-User-Id': 'u003' }
    }).then(res => res.data);
  },

  getAvailableReceivers: (): Promise<Array<{ id: string; name: string; department: string }>> => {
    return apiClient.get('/dispatches/receivers/available').then(res => res.data);
  }
};

export const rectificationApi = {
  getStats: (): Promise<RectificationStats> => {
    return apiClient.get('/rectification/stats').then(res => res.data);
  },

  submitReview: (data: ReviewRequest): Promise<{ message: string }> => {
    return apiClient.post('/rectification/reviews', data, {
      headers: { 'X-User-Id': 'u001' }
    }).then(res => res.data);
  }
};

export const userApi = {
  getUsers: (role?: string): Promise<User[]> => {
    return apiClient.get('/users', { params: { role } }).then(res => res.data);
  },

  getUserById: (id: string): Promise<User> => {
    return apiClient.get(`/users/${id}`).then(res => res.data);
  }
};
