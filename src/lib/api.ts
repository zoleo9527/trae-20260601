import type {
  Customer,
  CustomerDetail,
  Vehicle,
  PackageTemplate,
  CustomerPackage,
  Order,
  OrderItem,
  Inspection,
  DeductionRecord,
  TodayStats,
  ReworkRateStats,
  PackageConsumptionStats,
  CompensationStats,
  Employee,
} from '@/types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || '请求失败');
  }
  return data.data;
}

export const customersApi = {
  list: (search?: string) =>
    request<Customer[]>(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  get: (id: number) => request<CustomerDetail>(`/customers/${id}`),
  create: (data: Partial<Customer>) =>
    request<Customer>('/customers', { method: 'POST', body: JSON.stringify(data) }),
};

export const vehiclesApi = {
  list: (plate?: string) =>
    request<Vehicle[]>(`/vehicles${plate ? `?plate=${encodeURIComponent(plate)}` : ''}`),
  get: (id: number) => request<Vehicle>(`/vehicles/${id}`),
  create: (data: Partial<Vehicle>) =>
    request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
};

export const packagesApi = {
  templates: () => request<PackageTemplate[]>('/packages'),
  customerPackages: (customerId: number) =>
    request<CustomerPackage[]>(`/packages/customer/${customerId}`),
  purchase: (customerId: number, templateId: number) =>
    request<CustomerPackage>('/packages', {
      method: 'POST',
      body: JSON.stringify({ customer_id: customerId, package_template_id: templateId }),
    }),
  deduct: (
    id: number,
    data: { count: number; type: string; reason?: string; orderItemId?: number; service_type?: string }
  ) => request<CustomerPackage>(`/packages/${id}/deduct`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const ordersApi = {
  list: (date?: string, status?: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (status) params.set('status', status);
    return request<Order[]>(`/orders${params.toString() ? `?${params}` : ''}`);
  },
  get: (id: number) => request<Order & { items: OrderItem[]; inspections: Inspection[] }>(`/orders/${id}`),
  create: (data: {
    customer_id: number;
    vehicle_id: number;
    employee_id?: number;
    items: Array<{
      service_type: string;
      customer_package_id?: number;
      price?: number;
    }>;
  }) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<Order>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  assign: (id: number, employeeId: number) =>
    request<Order>(`/orders/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ employee_id: employeeId }),
    }),
};

export const inspectionsApi = {
  list: (status?: string) =>
    request<Inspection[]>(`/inspections${status ? `?status=${status}` : ''}`),
  create: (data: { order_id: number; inspector_id: number; result: string; reason?: string }) =>
    request<Inspection & { reworkOrderId?: number }>('/inspections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  rework: (id: number, reason?: string) =>
    request<Inspection>(`/inspections/${id}/rework`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const statsApi = {
  today: () => request<TodayStats>('/stats/today'),
  reworkRate: (period?: '7d' | '30d') =>
    request<ReworkRateStats>(`/stats/rework-rate${period ? `?period=${period}` : ''}`),
  packageConsumption: () => request<PackageConsumptionStats>('/stats/package-consumption'),
  compensation: () => request<CompensationStats>('/stats/compensation'),
};

export const employeesApi = {
  list: async () => {
    const res = await fetch(`${API_BASE}/auth/employees`);
    const data = await res.json();
    if (!data.success) {
      return [] as Employee[];
    }
    return data.data as Employee[];
  },
};

export const servicePrices: Record<string, number> = {
  镀膜: 680,
  精洗: 80,
  打蜡: 380,
  抛光: 580,
};
