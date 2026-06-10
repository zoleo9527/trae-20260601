import axios from 'axios';
import {
  Customer,
  Formula,
  CustomerOrder,
  FeedBatch,
  FeedingRecord,
  LoadingRecord,
  ExceptionRecord,
  StatsSummary
} from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

export const customerApi = {
  getAll: () => api.get<Customer[]>('/customers').then(r => r.data),
  getById: (id: string) => api.get<Customer>(`/customers/${id}`).then(r => r.data)
};

export const formulaApi = {
  getAll: () => api.get<Formula[]>('/formulas').then(r => r.data),
  getById: (id: string) => api.get<Formula>(`/formulas/${id}`).then(r => r.data)
};

export const orderApi = {
  getAll: (status?: string) => 
    api.get<CustomerOrder[]>('/orders', { params: { status } }).then(r => r.data),
  getById: (id: string) => api.get<CustomerOrder>(`/orders/${id}`).then(r => r.data),
  create: (data: any) => api.post<CustomerOrder>('/orders', data).then(r => r.data),
  confirm: (id: string, data: any) => 
    api.post<CustomerOrder>(`/orders/${id}/confirm`, data).then(r => r.data),
  ready: (id: string, data: any) => 
    api.post<CustomerOrder>(`/orders/${id}/ready`, data).then(r => r.data)
};

export const batchApi = {
  getAll: (formulaId?: string) => 
    api.get<FeedBatch[]>('/batches', { params: { formulaId } }).then(r => r.data),
  getById: (id: string) => api.get<FeedBatch>(`/batches/${id}`).then(r => r.data)
};

export const feedingRecordApi = {
  getAll: (batchId?: string) => 
    api.get<FeedingRecord[]>('/feeding-records', { params: { batchId } }).then(r => r.data)
};

export const loadingRecordApi = {
  getAll: (orderId?: string) => 
    api.get<LoadingRecord[]>('/loading-records', { params: { orderId } }).then(r => r.data),
  getById: (id: string) => api.get<LoadingRecord>(`/loading-records/${id}`).then(r => r.data),
  create: (data: any) => api.post<LoadingRecord>('/loading-records', data).then(r => r.data),
  update: (id: string, data: any) => 
    api.put<LoadingRecord>(`/loading-records/${id}`, data).then(r => r.data)
};

export const exceptionApi = {
  getAll: () => api.get<ExceptionRecord[]>('/exceptions').then(r => r.data),
  getById: (id: string) => api.get<ExceptionRecord>(`/exceptions/${id}`).then(r => r.data),
  create: (data: any) => api.post<ExceptionRecord>('/exceptions', data).then(r => r.data),
  handle: (id: string, data: any) => 
    api.put<ExceptionRecord>(`/exceptions/${id}/handle`, data).then(r => r.data)
};

export const statsApi = {
  getSummary: () => api.get<StatsSummary>('/stats/summary').then(r => r.data)
};