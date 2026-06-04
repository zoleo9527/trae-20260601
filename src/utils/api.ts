import type {
  Prescription,
  PrescriptionDetail,
  Role,
  RoleTodoCount,
  CreatePrescriptionRequest,
  ReviewRequest,
  DecoctRequest,
  DeliveryRequest,
  SignRequest,
  PrescriptionWithDeliverySummary,
} from '../../shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

export const api = {
  getAllPrescriptions: () => request<Prescription[]>('/prescriptions'),

  getPrescriptionsByRole: (role: Role) =>
    request<Prescription[]>(`/prescriptions/by-role/${role}`),

  getHistoryByRole: (role: Role) =>
    request<Prescription[]>(`/prescriptions/history/${role}`),

  getHistoryWithSummaryByRole: (role: Role) =>
    request<PrescriptionWithDeliverySummary[]>(`/prescriptions/history-with-summary/${role}`),

  getTodoCount: (role: Role) =>
    request<RoleTodoCount>(`/prescriptions/todo-count/${role}`),

  getPrescriptionDetail: (id: string) =>
    request<PrescriptionDetail>(`/prescriptions/${id}`),

  createPrescription: (data: CreatePrescriptionRequest) =>
    request<Prescription>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reviewPrescription: (id: string, data: ReviewRequest) =>
    request<PrescriptionDetail>(`/prescriptions/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  decoctPrescription: (id: string, data: DecoctRequest) =>
    request<PrescriptionDetail>(`/prescriptions/${id}/decoct`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deliveryPrescription: (id: string, data: DeliveryRequest) =>
    request<PrescriptionDetail>(`/prescriptions/${id}/delivery`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  signPrescription: (id: string, data: SignRequest) =>
    request<PrescriptionDetail>(`/prescriptions/${id}/sign`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
