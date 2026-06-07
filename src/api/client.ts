
import type {
  User,
  LoginRequest,
  LoginResponse,
  PromotionDisplay,
  InspectionRectification,
  CreatePromotionRequest,
  CreateInspectionRequest,
  ReplyInspectionRequest,
  DashboardStats,
  Remark,
  OperationHistory,
} from '../../shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

export const authApi = {
  login: (data: LoginRequest): Promise<LoginResponse> =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  logout: (): Promise<{ success: boolean }> =>
    request('/auth/logout', { method: 'POST' }),
};

export const userApi = {
  getDemoUsers: (): Promise<User[]> => request('/users/demo'),
  getDashboardStats: (): Promise<DashboardStats> => request('/users/dashboard/stats'),
};

export const promotionApi = {
  getAll: (): Promise<PromotionDisplay[]> => request('/promotions'),
  getById: (id: string): Promise<PromotionDisplay & { operationHistory?: OperationHistory[] }> => request(`/promotions/${id}`),
  create: (data: CreatePromotionRequest & { specialistId: string; specialistName: string }): Promise<PromotionDisplay> =>
    request('/promotions', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string, userId?: string, userName?: string, userRole?: string): Promise<{ success: boolean }> =>
    request(`/promotions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, userId, userName, userRole }) }),
  addRemark: (id: string, data: { userId: string; userName: string; userRole: string; content: string }): Promise<Remark> =>
    request(`/promotions/${id}/remarks`, { method: 'POST', body: JSON.stringify(data) }),
};

export const inspectionApi = {
  getAll: (): Promise<InspectionRectification[]> => request('/inspections'),
  getById: (id: string): Promise<InspectionRectification & { operationHistory?: OperationHistory[] }> => request(`/inspections/${id}`),
  create: (data: CreateInspectionRequest & { supervisorId: string; supervisorName: string }): Promise<InspectionRectification> =>
    request('/inspections', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string, rejectReason?: string, userId?: string, userName?: string, userRole?: string): Promise<{ success: boolean; rejected?: boolean }> =>
    request(`/inspections/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, rejectReason, userId, userName, userRole }) }),
  reply: (id: string, data: ReplyInspectionRequest & { userId?: string; userName?: string; userRole?: string }): Promise<{ success: boolean }> =>
    request(`/inspections/${id}/reply`, { method: 'POST', body: JSON.stringify(data) }),
  addRemark: (id: string, data: { userId: string; userName: string; userRole: string; content: string }): Promise<Remark> =>
    request(`/inspections/${id}/remarks`, { method: 'POST', body: JSON.stringify(data) }),
};

export const systemApi = {
  reset: (): Promise<{ success: boolean; message: string }> =>
    request('/system/reset', { method: 'POST' }),
};
