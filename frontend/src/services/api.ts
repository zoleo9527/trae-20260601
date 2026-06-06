import { GroupTicket, TodoItem, StatusLog, UserRole, GroupTicketStatus } from '../types';

const API_BASE = '/api';

function getHeaders(role: UserRole, userId: string = role === 'scheduling_manager' ? 'u1' : role === 'ticket_supervisor' ? 'u2' : 'u3') {
  return {
    'Content-Type': 'application/json',
    'X-User-Role': role,
    'X-User-Id': userId,
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
}

export async function getTickets(
  role: UserRole,
  params?: {
    status?: GroupTicketStatus;
    handler?: UserRole;
    hasReject?: boolean;
    hasSupplementary?: boolean;
    keyword?: string;
  }
): Promise<ApiResponse<GroupTicket[]>> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.handler) query.append('handler', params.handler);
  if (params?.hasReject !== undefined) query.append('hasReject', String(params.hasReject));
  if (params?.hasSupplementary !== undefined) query.append('hasSupplementary', String(params.hasSupplementary));
  if (params?.keyword) query.append('keyword', params.keyword);

  const res = await fetch(`${API_BASE}/tickets?${query.toString()}`, {
    headers: getHeaders(role),
  });
  return res.json();
}

export async function getTicketDetail(
  role: UserRole,
  ticketId: string
): Promise<ApiResponse<{ ticket: GroupTicket; logs: StatusLog[] }>> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
    headers: getHeaders(role),
  });
  return res.json();
}

export async function getTicketLogs(
  role: UserRole,
  ticketId: string
): Promise<ApiResponse<StatusLog[]>> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/logs`, {
    headers: getHeaders(role),
  });
  return res.json();
}

export async function getTodos(role: UserRole): Promise<ApiResponse<TodoItem[]>> {
  const res = await fetch(`${API_BASE}/todos`, {
    headers: getHeaders(role),
  });
  return res.json();
}

export async function startScheduling(role: UserRole, ticketId: string): Promise<ApiResponse<GroupTicket>> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/start-scheduling`, {
    method: 'POST',
    headers: getHeaders(role),
  });
  return res.json();
}

export async function submitSchedulingReview(
  role: UserRole,
  ticketId: string,
  data: {
    approved: boolean;
    reason?: string;
    supplementaryRemark?: string;
  }
): Promise<ApiResponse<GroupTicket>> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/scheduling-review`, {
    method: 'POST',
    headers: getHeaders(role),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function startVerification(role: UserRole, ticketId: string): Promise<ApiResponse<GroupTicket>> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/start-verification`, {
    method: 'POST',
    headers: getHeaders(role),
  });
  return res.json();
}

export async function submitVerification(
  role: UserRole,
  ticketId: string,
  data: {
    actualAttendance: number;
    ticketUsed: number;
    ticketRefunded: number;
    remark?: string;
  }
): Promise<ApiResponse<GroupTicket>> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/submit-verification`, {
    method: 'POST',
    headers: getHeaders(role),
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function reviewVerification(
  role: UserRole,
  ticketId: string,
  data: {
    approved: boolean;
    reason?: string;
    reviewRemark?: string;
  }
): Promise<ApiResponse<GroupTicket>> {
  const res = await fetch(`${API_BASE}/tickets/${ticketId}/review-verification`, {
    method: 'POST',
    headers: getHeaders(role),
    body: JSON.stringify(data),
  });
  return res.json();
}

export function getExportUrl(params?: {
  status?: GroupTicketStatus;
  handler?: UserRole;
  hasReject?: boolean;
  hasSupplementary?: boolean;
  keyword?: string;
}): string {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.handler) query.append('handler', params.handler);
  if (params?.hasReject !== undefined) query.append('hasReject', String(params.hasReject));
  if (params?.hasSupplementary !== undefined) query.append('hasSupplementary', String(params.hasSupplementary));
  if (params?.keyword) query.append('keyword', params.keyword);
  return `${API_BASE}/export/tickets?${query.toString()}`;
}
