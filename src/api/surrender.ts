import type {
  SurrenderApplication,
  ApplicationStatus,
  Inspection,
  CostBreakdown,
  Dispute,
  DisputeResponse,
} from '@/types';

const BASE_URL = '/api/surrender';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE_URL + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data;
}

export const surrenderApi = {
  listApplications(status?: ApplicationStatus) {
    const qs = status ? `?status=${status}` : '';
    return request<SurrenderApplication[]>(`/${qs}`);
  },

  getApplication(id: string) {
    return request<SurrenderApplication>(`/${id}`);
  },

  createApplication(
    data: Omit<SurrenderApplication, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'confirmation'>,
  ) {
    return request<SurrenderApplication>('/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateStatus(id: string, status: ApplicationStatus) {
    return request<SurrenderApplication>(`/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  submitInspection(id: string, inspection: Inspection) {
    return request<SurrenderApplication>(`/${id}/inspection`, {
      method: 'PUT',
      body: JSON.stringify(inspection),
    });
  },

  submitCostBreakdown(id: string, costBreakdown: CostBreakdown) {
    return request<SurrenderApplication>(`/${id}/cost`, {
      method: 'PUT',
      body: JSON.stringify(costBreakdown),
    });
  },

  submitDispute(
    id: string,
    dispute: Omit<Dispute, 'id' | 'createdAt'>,
  ) {
    return request<SurrenderApplication>(`/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify(dispute),
    });
  },

  respondDispute(
    id: string,
    disputeId: string,
    response: DisputeResponse,
  ) {
    return request<SurrenderApplication>(`/${id}/dispute/${disputeId}/respond`, {
      method: 'PUT',
      body: JSON.stringify(response),
    });
  },

  finalConfirm(id: string, confirmerName: string) {
    return request<SurrenderApplication>(`/${id}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ confirmerName }),
    });
  },

  calculate(id: string) {
    return request<{
      totalDeposit: number;
      totalDeduction: number;
      refundAmount: number;
      breakdown: CostBreakdown;
    }>(`/${id}/calculate`);
  },

  getStats() {
    return request<{
      total: number;
      pending: number;
      inspecting: number;
      costing: number;
      confirming: number;
      disputing: number;
      completed: number;
      totalDepositAmount: number;
      totalRefundPending: number;
    }>('/stats/summary');
  },
};
