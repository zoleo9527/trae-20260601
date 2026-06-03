import type { Banquet, BanquetSummary, Alert, CompareResult, ConfirmRecord } from '@shared/types';

const BASE_URL = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  getBanquets: (params?: { type?: string; status?: string; search?: string }) => {
    const query = params ? new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== 'all')).toString() : '';
    return request<BanquetSummary[]>(`/banquets${query ? `?${query}` : ''}`);
  },

  getBanquet: (id: string) => {
    return request<Banquet>(`/banquets/${id}`);
  },

  getVersions: (banquetId: string) => {
    return request<Array<{ version: number; hall: string; tableCount: number; createdAt: string; createdBy: string; changeDescription: string }>>(`/banquets/${banquetId}/versions`);
  },

  compareVersions: (banquetId: string, v1: number, v2: number) => {
    return request<CompareResult>(`/banquets/${banquetId}/compare?v1=${v1}&v2=${v2}`);
  },

  confirmBanquet: (banquetId: string, data: { version: number; role: string; confirmer: string; remark?: string; signature?: string }) => {
    return request<{ success: boolean; confirm: ConfirmRecord; banquet: Banquet }>(`/banquets/${banquetId}/confirm`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAlerts: (params?: { scope?: string; priority?: string; acknowledged?: string }) => {
    const query = params ? new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined && v !== 'all')).toString() : '';
    return request<Alert[]>(`/alerts${query ? `?${query}` : ''}`);
  },

  acknowledgeAlert: (alertId: string, acknowledgedBy?: string) => {
    return request<{ success: boolean; alert: Alert }>(`/alerts/${alertId}/ack`, {
      method: 'POST',
      body: JSON.stringify({ acknowledgedBy }),
    });
  },
};
