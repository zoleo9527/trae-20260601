
import type {
  User,
  Station,
  Device,
  Fault,
  FaultTimeline,
  WorkOrder,
  Order,
  Complaint,
  Settlement,
  SettlementAdjustment,
  Dispute,
  DashboardStats,
  LoginRequest,
  LoginResponse,
} from '../../shared/types';

const API_BASE = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || '请求失败');
  }

  if (!data.success) {
    throw new Error(data.message || '请求失败');
  }

  return data.data;
}

export const api = {
  auth: {
    login: (credentials: LoginRequest) =>
      request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    me: () => request<User>('/auth/me'),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
  },

  stations: {
    list: (params?: { status?: string }) => {
      const query = params?.status ? `?status=${params.status}` : '';
      return request<Station[]>(`/stations${query}`);
    },
    get: (id: string) => request<Station>(`/stations/${id}`),
    devices: (stationId: string) => request<Device[]>(`/stations/${stationId}/devices`),
  },

  faults: {
    list: (params?: { status?: string; severity?: string; type?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<Fault[]>(`/faults${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<Fault>(`/faults/${id}`),
    timeline: (faultId: string) => request<FaultTimeline[]>(`/faults/${faultId}/timeline`),
    orders: (faultId: string) => request<Order[]>(`/faults/${faultId}/orders`),
  },

  workOrders: {
    list: (params?: { status?: string; maintenanceId?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<WorkOrder[]>(`/workorders${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<WorkOrder>(`/workorders/${id}`),
    updateStatus: (id: string, status: string) =>
      request<WorkOrder>(`/workorders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }),
  },

  orders: {
    list: (params?: { status?: string; stationId?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<Order[]>(`/orders${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<Order>(`/orders/${id}`),
    refund: (id: string, reason: string, amount?: number) =>
      request<Order>(`/orders/${id}/refund`, {
        method: 'POST',
        body: JSON.stringify({ reason, amount }),
      }),
  },

  complaints: {
    list: (params?: { status?: string; type?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<Complaint[]>(`/complaints${query ? `?${query}` : ''}`);
    },
    get: (id: string) => request<Complaint>(`/complaints/${id}`),
    update: (id: string, data: { status?: string; handler?: string; handleNotes?: string }) =>
      request<Complaint>(`/complaints/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  settlements: {
    overview: () => request<{ totalAmount: number; totalPlatformShare: number; totalPartnerShare: number; totalRefundDeduction: number; settlementCount: number; disputedCount: number }>('/settlements/overview'),
    details: (params?: { stationId?: string; status?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<Settlement[]>(`/settlements/details${query ? `?${query}` : ''}`);
    },
    adjustments: (params?: { stationId?: string; type?: string }) => {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      return request<SettlementAdjustment[]>(`/settlements/adjustments${query ? `?${query}` : ''}`);
    },
    disputes: (params?: { status?: string }) => {
      const query = params?.status ? `?status=${params.status}` : '';
      return request<Dispute[]>(`/settlements/disputes${query}`);
    },
    updateDispute: (id: string, data: { status?: string; handler?: string; resolution?: string }) =>
      request<Dispute>(`/settlements/disputes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  stats: {
    dashboard: () => request<DashboardStats>('/stats/dashboard'),
    trends: () =>
      request<{
        faultTrends: { date: string; count: number }[];
        revenueTrends: { date: string; revenue: number }[];
        workOrderTrends: { date: string; completed: number; pending: number }[];
      }>('/stats/trends'),
  },
};
