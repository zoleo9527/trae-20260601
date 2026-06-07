import client from './client';
import type { User, DailyOrder, MorningCheckin, Exception, Replenishment, TimelineEvent } from '@/types';

export interface LoginResponse {
  token: string;
  user: User;
}

export const authAPI = {
  login: (username: string, password: string) =>
    client.post<LoginResponse>('/auth/login', { username, password }),
  logout: () => client.post('/auth/logout'),
  getMe: () => client.get<{ user: User }>('/auth/me'),
};

export const ordersAPI = {
  getList: (params?: { date?: string; routeId?: number; status?: string; customerId?: number }) =>
    client.get<{ orders: DailyOrder[] }>('/orders', { params }),
  getDetail: (id: number) => client.get<{ order: DailyOrder }>(`/orders/${id}`),
  updateStatus: (id: number, status: string, remark?: string) =>
    client.put(`/orders/${id}/status`, { status, remark }),
  getDailySummary: (date?: string) =>
    client.get<{ date: string; summary: any[] }>('/orders/summary/daily', { params: { date } }),
};

export const checkinsAPI = {
  getList: (params?: { date?: string; routeId?: number; status?: string; courierId?: number }) =>
    client.get<{ checkins: MorningCheckin[] }>('/checkins', { params }),
  getDetail: (id: number) =>
    client.get<{ checkin: MorningCheckin; orders: DailyOrder[]; exceptions: Exception[] }>(`/checkins/${id}`),
  create: (data: { checkin_date: string; route_id: number; courier_id: number; remark?: string }) =>
    client.post<{ id: number; message: string }>('/checkins', data),
  submit: (id: number, data: { signed_orders: number; exception_orders: number; remark?: string }) =>
    client.put<{ message: string }>(`/checkins/${id}/submit`, data),
  confirm: (id: number, data: { remark?: string }) =>
    client.put<{ message: string }>(`/checkins/${id}/confirm`, data),
};

export const exceptionsAPI = {
  getList: (params?: { status?: string; checkinId?: number; dailyOrderId?: number; type?: string }) =>
    client.get<{ exceptions: Exception[] }>('/exceptions', { params }),
  getDetail: (id: number) =>
    client.get<{ exception: Exception; replenishments: Replenishment[] }>(`/exceptions/${id}`),
  create: (data: { daily_order_id: number; checkin_id?: number; type: string; description?: string }) =>
    client.post<{ id: number; message: string }>('/exceptions', data),
  updateStatus: (id: number, status: string, remark?: string) =>
    client.put(`/exceptions/${id}/status`, { status, remark }),
};

export const replenishmentsAPI = {
  getList: (params?: { status?: string; exceptionId?: number; dailyOrderId?: number }) =>
    client.get<{ replenishments: Replenishment[] }>('/replenishments', { params }),
  getDetail: (id: number) => client.get<{ replenishment: Replenishment }>(`/replenishments/${id}`),
  create: (data: { exception_id: number; daily_order_id: number; quantity: number; method: string; remark?: string }) =>
    client.post<{ id: number; message: string }>('/replenishments', data),
  deliver: (id: number, data?: { remark?: string }) =>
    client.put<{ message: string }>(`/replenishments/${id}/deliver`, data),
  confirm: (id: number, data?: { remark?: string }) =>
    client.put<{ message: string }>(`/replenishments/${id}/confirm`, data),
};

export const timelineAPI = {
  getOrderTimeline: (orderId: number) =>
    client.get<{ order: DailyOrder; timeline: TimelineEvent[] }>(`/timeline/order/${orderId}`),
  getCheckinTimeline: (checkinId: number) =>
    client.get<{ checkin: MorningCheckin; timeline: TimelineEvent[] }>(`/timeline/checkin/${checkinId}`),
};

export const usersAPI = {
  getCouriers: () => client.get<{ couriers: User[] }>('/users/couriers'),
};
