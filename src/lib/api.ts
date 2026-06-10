export interface User {
  id: number;
  name: string;
  role: 'feeder' | 'sorter' | 'manager';
  username: string;
}

export interface Inspection {
  id: number;
  coop_id: number;
  coop_code?: string;
  coop_name?: string;
  inspector_id: number | null;
  inspector_name?: string;
  status: 'pending' | 'in_progress' | 'pending_confirm' | 'completed' | 'anomaly';
  temperature: number | null;
  humidity: number | null;
  ventilation: string | null;
  water_status: string | null;
  feed_status: string | null;
  flock_status: string | null;
  notes: string | null;
  claimed_at: number | null;
  completed_at: number | null;
  created_at: number;
  is_overdue?: boolean;
  attachments?: Attachment[];
}

export interface EggRecord {
  id: number;
  coop_id: number;
  coop_code?: string;
  coop_name?: string;
  inspection_id: number | null;
  inspection_code?: string;
  sorter_id: number | null;
  sorter_name?: string;
  total_eggs: number;
  broken_eggs: number;
  dirty_eggs: number;
  grade_a: number;
  grade_b: number;
  grade_c: number;
  status: 'pending' | 'completed' | 'anomaly';
  notes: string | null;
  created_at: number;
  confirmed_at: number | null;
  has_anomaly?: boolean;
}

export interface Anomaly {
  id: number;
  type: 'inspection' | 'egg' | 'equipment' | 'environment';
  source_type: 'inspection' | 'egg_record' | null;
  source_id: number | null;
  coop_id: number;
  coop_code?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'processing' | 'resolved' | 'closed';
  reporter_id: number;
  reporter_name?: string;
  assignee_id: number | null;
  assignee_name?: string;
  created_at: number;
  resolved_at: number | null;
  timeline?: AnomalyTimelineItem[];
}

export interface AnomalyTimelineItem {
  id: number;
  anomaly_id: number;
  action: string;
  content: string | null;
  operator_id: number;
  operator_name?: string;
  created_at: number;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: 'anomaly' | 'reminder' | 'escalation' | 'system';
  read: boolean;
  created_at: number;
}

export interface Attachment {
  id: number;
  entity_type: 'inspection' | 'anomaly';
  entity_id: number;
  filename: string;
  original_name: string;
  size: number;
  created_at: number;
}

export interface DashboardStats {
  overdue_inspections: number;
  incomplete_egg_records: number;
  pending_anomalies: number;
}

export interface CoopStatus {
  coop_id: number;
  coop_code: string;
  coop_name: string;
  status: 'pending' | 'in_progress' | 'pending_confirm' | 'completed' | 'anomaly';
  inspector_name: string | null;
  elapsed_minutes: number | null;
  is_overdue: boolean;
}

export interface TodoItem {
  id: number;
  type: 'inspection' | 'egg';
  coop_code: string;
  status: string;
  handler_name: string | null;
  elapsed_minutes: number | null;
  priority: 'high' | 'medium' | 'low';
}

const BASE_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  return res as unknown as T;
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
  },

  inspections: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: Inspection[] }>(`/inspections${qs}`);
    },
    get: (id: number) =>
      request<{ data: Inspection }>(`/inspections/${id}`),
    create: (data: Partial<Inspection>) =>
      request<{ data: Inspection }>('/inspections', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Inspection>) =>
      request<{ data: Inspection }>(`/inspections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    claim: (id: number) =>
      request<{ data: Inspection }>(`/inspections/${id}/claim`, { method: 'POST' }),
    confirm: (id: number) =>
      request<{ data: Inspection }>(`/inspections/${id}/confirm`, { method: 'POST' }),
    exportCsv: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      const token = getToken();
      window.open(`${BASE_URL}/inspections/export${qs}${token ? `?token=${token}` : ''}`, '_blank');
    },
  },

  eggRecords: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: EggRecord[] }>(`/egg-records${qs}`);
    },
    get: (id: number) =>
      request<{ data: EggRecord }>(`/egg-records/${id}`),
    create: (data: Partial<EggRecord>) =>
      request<{ data: EggRecord }>('/egg-records', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<EggRecord>) =>
      request<{ data: EggRecord }>(`/egg-records/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    exportCsv: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      const token = getToken();
      window.open(`${BASE_URL}/egg-records/export${qs}${token ? `&token=${token}` : ''}`, '_blank');
    },
  },

  anomalies: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ data: Anomaly[] }>(`/anomalies${qs}`);
    },
    get: (id: number) =>
      request<{ data: Anomaly }>(`/anomalies/${id}`),
    create: (data: Partial<Anomaly>) =>
      request<{ data: Anomaly }>('/anomalies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<Anomaly>) =>
      request<{ data: Anomaly }>(`/anomalies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    timeline: (id: number) =>
      request<{ data: AnomalyTimelineItem[] }>(`/anomalies/${id}/timeline`),
  },

  notifications: {
    list: () =>
      request<{ data: Notification[] }>('/notifications'),
    markRead: (id: number) =>
      request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () =>
      request<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),
  },

  dashboard: {
    stats: () =>
      request<{ data: DashboardStats }>('/dashboard/stats'),
    todos: () =>
      request<{ data: TodoItem[] }>('/dashboard/todos'),
    coopStatus: () =>
      request<{ data: CoopStatus[] }>('/dashboard/coop-status'),
  },

  upload: {
    file: async (file: File, entityType: string, entityId: number) => {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entity_type', entityType);
      formData.append('entity_id', String(entityId));
      const res = await fetch(`${BASE_URL}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('上传失败');
      return res.json();
    },
  },
};
