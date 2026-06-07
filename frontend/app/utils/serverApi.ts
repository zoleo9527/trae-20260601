const API_BASE = process.env.API_BASE_URL || 'http://localhost:3001/api';

async function serverRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

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

export const serverApi = {
  getUsers: () => serverRequest<any[]>('/users'),
  getPonds: () => serverRequest<any[]>('/ponds'),
  getPond: (id: string) => serverRequest<any>(`/ponds/${id}`),
  getMedicines: () => serverRequest<any[]>('/medicines'),
  getInspections: (pondId?: string) => serverRequest<any[]>(`/inspections${pondId ? `?pondId=${pondId}` : ''}`),
  getFeedRecords: (pondId?: string) => serverRequest<any[]>(`/feed-records${pondId ? `?pondId=${pondId}` : ''}`),

  getDiseaseCases: (params?: { status?: string; handlerRole?: string; pondId?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.handlerRole) query.set('handlerRole', params.handlerRole);
    if (params?.pondId) query.set('pondId', params.pondId);
    return serverRequest<any[]>(`/disease-cases${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getDiseaseCase: (id: string) => serverRequest<any>(`/disease-cases/${id}`),

  getTraceByPond: (pondId: string, params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    return serverRequest<any[]>(`/trace/ponds/${pondId}/medications${query.toString() ? `?${query.toString()}` : ''}`);
  },
  getTraceByDiseaseCase: (caseId: string) => serverRequest<any>(`/trace/disease-cases/${caseId}`),
  getPondMedicationSummary: (pondId: string) => serverRequest<any[]>(`/trace/ponds/${pondId}/summary`),
};
