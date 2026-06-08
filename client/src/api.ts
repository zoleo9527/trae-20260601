import type {
  CargoOrder,
  LocationAllocation,
  PickupAppointment,
  StatusChangeLog,
  DashboardStats,
} from './types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export const api = {
  orders: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<CargoOrder[]>(`/orders${qs}`);
    },
    get: (id: number) => request<CargoOrder>(`/orders/${id}`),
    create: (data: Partial<CargoOrder>) =>
      request<CargoOrder>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    transition: (data: {
      order_id: number;
      to_status: string;
      changed_by: string;
      role: string;
      notes?: string;
    }) => request<CargoOrder>('/orders/transition', { method: 'POST', body: JSON.stringify(data) }),
    logs: (id: number) => request<StatusChangeLog[]>(`/orders/${id}/logs`),
  },
  allocations: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<LocationAllocation[]>(`/allocations${qs}`);
    },
    get: (id: number) => request<LocationAllocation>(`/allocations/${id}`),
    create: (data: {
      order_id: number;
      zone: string;
      shelf: string;
      position: string;
      allocated_by: string;
      notes?: string;
    }) => request<LocationAllocation>('/allocations', { method: 'POST', body: JSON.stringify(data) }),
    action: (data: {
      allocation_id: number;
      action: string;
      changed_by: string;
      zone?: string;
      shelf?: string;
      position?: string;
      notes?: string;
    }) => request<LocationAllocation>('/allocations/action', { method: 'POST', body: JSON.stringify(data) }),
    logs: (id: number) => request<StatusChangeLog[]>(`/allocations/${id}/logs`),
  },
  appointments: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<PickupAppointment[]>(`/appointments${qs}`);
    },
    get: (id: number) => request<PickupAppointment>(`/appointments/${id}`),
    create: (data: {
      order_id: number;
      appointee: string;
      contact_phone: string;
      appointment_time?: string;
      notes?: string;
    }) => request<PickupAppointment>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    action: (data: {
      appointment_id: number;
      action: string;
      changed_by: string;
      appointment_time?: string;
      notes?: string;
    }) => request<PickupAppointment>('/appointments/action', { method: 'POST', body: JSON.stringify(data) }),
    logs: (id: number) => request<StatusChangeLog[]>(`/appointments/${id}/logs`),
  },
  logs: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<StatusChangeLog[]>(`/logs${qs}`);
    },
    stats: () => request<DashboardStats>('/logs/stats'),
  },
};
