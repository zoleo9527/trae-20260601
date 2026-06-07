import { v4 as uuidv4 } from 'uuid';

const API_BASE = '/api';

async function request<T>(
  path: string,
  options: RequestInit = {},
  idempotent: boolean = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (idempotent && (options.method === 'POST' || options.method === 'PUT')) {
    headers['x-idempotency-key'] = uuidv4();
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || '请求失败');
  }
  return data;
}

export const api = {
  getUsers: () => request<any[]>('/users'),
  getPonds: () => request<any[]>('/ponds'),
  getPond: (id: string) => request<any>(`/ponds/${id}`),
  getMedicines: () => request<any[]>('/medicines'),
  getInspections: (pondId?: string) => request<any[]>(`/inspections${pondId ? `?pondId=${pondId}` : ''}`),
  getFeedRecords: (pondId?: string) => request<any[]>(`/feed-records${pondId ? `?pondId=${pondId}` : ''}`),

  getDiseaseCases: (params?: { status?: string; handlerRole?: string; pondId?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.handlerRole) query.set('handlerRole', params.handlerRole);
    if (params?.pondId) query.set('pondId', params.pondId);
    return request<any[]>(`/disease-cases${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getDiseaseCase: (id: string) => request<any>(`/disease-cases/${id}`),
  createDiseaseCase: (data: any) => request<any>('/disease-cases', { method: 'POST', body: JSON.stringify(data) }),
  updateDiseaseCaseDraft: (id: string, data: any) => request<any>(`/disease-cases/${id}/draft`, { method: 'PUT', body: JSON.stringify(data) }),
  submitDiseaseCase: (id: string, operatorId: string) => request<any>(`/disease-cases/${id}/submit`, { method: 'POST', body: JSON.stringify({ operatorId }) }),
  rejectDiseaseCase: (id: string, data: { operatorId: string; rejectReason: string }) => request<any>(`/disease-cases/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  allocateMedicine: (id: string, data: { operatorId: string; medicines: { id: string; actualQuantity: number }[] }) => request<any>(`/disease-cases/${id}/allocate-medicine`, { method: 'POST', body: JSON.stringify(data) }),
  approveDiseaseCase: (id: string, data: { operatorId: string; remark?: string }) => request<any>(`/disease-cases/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  recordMedication: (id: string, data: { operatorId: string; medicationDate: string; notes?: string }) => request<any>(`/disease-cases/${id}/record-medication`, { method: 'POST', body: JSON.stringify(data) }),
  closeDiseaseCase: (id: string, data: { operatorId: string; remark?: string }) => request<any>(`/disease-cases/${id}/close`, { method: 'POST', body: JSON.stringify(data) }),

  getTraceByPond: (pondId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<any[]>(`/trace/ponds/${pondId}/medications${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getTraceByDiseaseCase: (caseId: string) => request<any>(`/trace/disease-cases/${caseId}`),
  getTraceByMedicine: (medicineId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return request<any[]>(`/trace/medicines/${medicineId}/usage${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getPondMedicationSummary: (pondId: string) => request<any[]>(`/trace/ponds/${pondId}/summary`),

  resetDemoData: () => request<any>('/demo/reset', { method: 'POST' }, false),
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: '草稿',
  SUBMITTED: '已提交待配药',
  REJECTED: '已驳回待补录',
  MEDICINE_ALLOCATED: '已配药待审批',
  APPROVED: '已审批待用药',
  MEDICATED: '已用药待结案',
  CLOSED: '已结案',
};

export const SEVERITY_LABELS: Record<string, string> = {
  MILD: '轻度',
  MODERATE: '中度',
  SEVERE: '重度',
};

export const ACTION_LABELS: Record<string, string> = {
  CREATE_DRAFT: '创建草稿',
  UPDATE_DRAFT: '修改草稿',
  SUBMIT: '提交',
  REJECT: '驳回',
  ALLOCATE_MEDICINE: '配药出库',
  APPROVE: '审批通过',
  RECORD_MEDICATION: '记录用药',
  CLOSE: '结案',
};
