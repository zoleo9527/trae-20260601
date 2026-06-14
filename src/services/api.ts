import type {
  Reminder,
  User,
  Student,
  ScheduleReminderRequest,
  ExecuteReminderRequest,
  ConfirmFeeRequest,
  ReviewRequest,
  DisputeRequest,
  MarkRiskRequest,
  ResolveRiskRequest,
} from '../../shared/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error || '请求失败');
  }
  return json.data;
}

export function fetchReminders(status?: string, keyword?: string): Promise<Reminder[]> {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (keyword) params.set('keyword', keyword);
  const qs = params.toString();
  return request<Reminder[]>(`/api/reminders${qs ? '?' + qs : ''}`);
}

export function fetchReminder(id: string): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}`);
}

export function scheduleReminder(
  id: string,
  payload: ScheduleReminderRequest & { operatorId: string }
): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}/schedule`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function executeReminder(
  id: string,
  payload: ExecuteReminderRequest & { operatorId: string }
): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}/execute`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function confirmFee(
  id: string,
  payload: ConfirmFeeRequest & { operatorId: string }
): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}/confirm-fee`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function reviewReminder(
  id: string,
  payload: ReviewRequest & { operatorId: string }
): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function markDispute(
  id: string,
  payload: DisputeRequest
): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}/dispute`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function resolveDispute(
  id: string,
  payload: { remark: string; resolveTo: string } & { operatorId: string }
): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}/resolve-dispute`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function fetchUsers(role?: string): Promise<User[]> {
  const qs = role ? `?role=${role}` : '';
  return request<User[]>(`/api/reminders/meta/users${qs}`);
}

export function fetchStudents(): Promise<Student[]> {
  return request<Student[]>('/api/reminders/meta/students');
}

export function markRisk(
  id: string,
  payload: MarkRiskRequest
): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}/risk`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function resolveRisk(
  id: string,
  riskId: string,
  payload: ResolveRiskRequest
): Promise<Reminder> {
  return request<Reminder>(`/api/reminders/${id}/risk/${riskId}/resolve`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
