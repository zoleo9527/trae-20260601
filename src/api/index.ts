import axios from 'axios';
import { Order, Staff, Scheduling, Checkin, OperationLog, OrderDetail } from '../types';

const BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const getOrders = async (status?: string): Promise<Order[]> => {
  const params = status ? { status } : {};
  const response = await api.get<Order[]>('/orders', { params });
  return response.data;
};

export const getOrderById = async (id: number): Promise<Order> => {
  const response = await api.get<Order>(`/orders/${id}`);
  return response.data;
};

export const getOrderDetail = async (id: number): Promise<OrderDetail> => {
  const response = await api.get<OrderDetail>(`/orders/${id}/detail`);
  return response.data;
};

export const getStaff = async (role?: string, status?: string): Promise<Staff[]> => {
  const params: Record<string, string> = {};
  if (role) params.role = role;
  if (status) params.status = status;
  const response = await api.get<Staff[]>('/staff', { params });
  return response.data;
};

export const getScheduling = async (
  orderId?: number,
  staffId?: number,
  status?: string
): Promise<Scheduling[]> => {
  const params: Record<string, string | number> = {};
  if (orderId) params.orderId = orderId;
  if (staffId) params.staffId = staffId;
  if (status) params.status = status;
  const response = await api.get<Scheduling[]>('/scheduling', { params });
  return response.data;
};

export const getCheckin = async (
  schedulingId?: number,
  staffId?: number,
  status?: string
): Promise<Checkin[]> => {
  const params: Record<string, string | number> = {};
  if (schedulingId) params.schedulingId = schedulingId;
  if (staffId) params.staffId = staffId;
  if (status) params.status = status;
  const response = await api.get<Checkin[]>('/checkin', { params });
  return response.data;
};

export const getLogs = async (orderId?: number): Promise<OperationLog[]> => {
  const params = orderId ? { orderId } : {};
  const response = await api.get<OperationLog[]>('/logs', { params });
  return response.data;
};

export const createScheduling = async (data: {
  orderId: number;
  staffId: number;
  scheduleDate: string;
  scheduleTime: string;
  remark?: string;
}): Promise<{ id: number }> => {
  const response = await api.post<{ id: number }>('/scheduling', data);
  return response.data;
};

export const createCheckin = async (data: {
  schedulingId: number;
  staffId: number;
  checkinTime: string;
  status: string;
  remark: string;
  notArrivedReason?: string;
}): Promise<{ id: number }> => {
  const response = await api.post<{ id: number }>('/checkin', data);
  return response.data;
};

export const updateCheckin = async (
  id: number,
  data: { status: string; remark: string; notArrivedReason?: string }
): Promise<{ changes: number }> => {
  const response = await api.put<{ changes: number }>(`/checkin/${id}`, data);
  return response.data;
};

export const updateBlockReason = async (
  orderId: number,
  blockReason: string
): Promise<{ changes: number }> => {
  const response = await api.put<{ changes: number }>(`/orders/${orderId}/block-reason`, { blockReason });
  return response.data;
};