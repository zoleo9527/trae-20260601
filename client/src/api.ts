import type { Complaint, ComplaintStatus, AssignTarget, CompensationType, User } from './types';

const BASE = '/api';

let currentUserId = '';

export function setUserId(id: string) {
  currentUserId = id;
}

export function getUserId() {
  return currentUserId;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (currentUserId) h['X-User-Id'] = currentUserId;
  return h;
}

export async function fetchComplaints(filters?: { status?: string; overdue?: boolean }): Promise<Complaint[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.overdue) params.set('overdue', 'true');
  const qs = params.toString();
  const url = `${BASE}/complaints${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) throw new Error(`获取投诉列表失败: ${res.status}`);
  return res.json();
}

export async function fetchComplaint(id: string): Promise<Complaint> {
  const res = await fetch(`${BASE}/complaints/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(`获取投诉详情失败: ${res.status}`);
  return res.json();
}

export async function createComplaint(data: {
  title: string;
  description: string;
  tourGroup: string;
  complaintType: string;
  severity: string;
}): Promise<Complaint> {
  const res = await fetch(`${BASE}/complaints`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`创建投诉失败: ${res.status}`);
  return res.json();
}

export async function assignComplaint(id: string, data: { assignedRole: AssignTarget; assignedTo: string }): Promise<Complaint> {
  const res = await fetch(`${BASE}/complaints/${id}/assign`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`指派投诉失败: ${res.status}`);
  return res.json();
}

export async function addNote(id: string, content: string): Promise<Complaint> {
  const res = await fetch(`${BASE}/complaints/${id}/notes`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`添加备注失败: ${res.status}`);
  return res.json();
}

export async function changeStatus(id: string, status: ComplaintStatus): Promise<Complaint> {
  const res = await fetch(`${BASE}/complaints/${id}/status`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`更改状态失败: ${res.status}`);
  return res.json();
}

export async function proposeCompensation(id: string, data: { type: CompensationType; amount: number; description: string }): Promise<Complaint> {
  const res = await fetch(`${BASE}/complaints/${id}/compensation`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`提出补偿方案失败: ${res.status}`);
  return res.json();
}

export async function reviewCompensation(id: string, data: { action: 'approve' | 'reject'; rejectionReason?: string }): Promise<Complaint> {
  const res = await fetch(`${BASE}/complaints/${id}/compensation`, {
    method: 'PATCH',
    headers: headers(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`审批补偿失败: ${res.status}`);
  return res.json();
}

export async function executeCompensation(id: string): Promise<Complaint> {
  const res = await fetch(`${BASE}/complaints/${id}/compensation/execute`, {
    method: 'POST',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`执行补偿失败: ${res.status}`);
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${BASE}/roles/users`, { headers: headers() });
  if (!res.ok) throw new Error(`获取用户列表失败: ${res.status}`);
  return res.json();
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch(`${BASE}/roles/current`, { headers: headers() });
  if (!res.ok) throw new Error(`获取当前用户失败: ${res.status}`);
  return res.json();
}

export async function resetData(): Promise<void> {
  const res = await fetch(`${BASE}/seed`, {
    method: 'POST',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`重置数据失败: ${res.status}`);
}
