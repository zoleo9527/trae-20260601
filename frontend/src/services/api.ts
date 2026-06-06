import { CaseDetailResponse, CaseRecord, CaseStatus, StatusLog, TodoItem, UserRole } from '../types';

const API_BASE = '/api';

const getHeaders = (role: UserRole) => ({
  'Content-Type': 'application/json',
  'x-user-role': role,
  'x-user-id': `user_${role}_1`
});

export const api = {
  getTodos: async (role: UserRole): Promise<TodoItem[]> => {
    const res = await fetch(`${API_BASE}/todos`, {
      headers: getHeaders(role)
    });
    const data = await res.json();
    return data.todos;
  },

  getCases: async (role: UserRole, status?: CaseStatus): Promise<CaseRecord[]> => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const res = await fetch(`${API_BASE}/cases?${params}`, {
      headers: getHeaders(role)
    });
    const data = await res.json();
    return data.cases;
  },

  getCaseDetail: async (caseId: string, role: UserRole): Promise<CaseDetailResponse> => {
    const res = await fetch(`${API_BASE}/cases/${caseId}`, {
      headers: getHeaders(role)
    });
    return res.json();
  },

  getCaseLogs: async (caseId: string, role: UserRole): Promise<StatusLog[]> => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/logs`, {
      headers: getHeaders(role)
    });
    const data = await res.json();
    return data.logs;
  },

  submitCaseData: async (caseId: string, settlementData: any, supplementaryRemark: string | undefined, role: UserRole) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/submit-data`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify({ settlementData, supplementaryRemark })
    });
    return res.json();
  },

  reviewCaseData: async (caseId: string, approved: boolean, rejectReason: string | undefined, role: UserRole) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/review-data`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify({ approved, rejectReason })
    });
    return res.json();
  },

  transitionCase: async (caseId: string, targetStatus: CaseStatus, remark: string | undefined, role: UserRole) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/transition`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify({ targetStatus, remark })
    });
    return res.json();
  },

  handleSettlement: async (
    caseId: string, 
    action: 'submit' | 'review' | 'resubmit' | 'pay', 
    options: {
      approved?: boolean;
      remark?: string;
      rejectReason?: string;
      supplementaryRemark?: string;
    }, 
    role: UserRole
  ) => {
    const res = await fetch(`${API_BASE}/cases/${caseId}/settlement`, {
      method: 'POST',
      headers: getHeaders(role),
      body: JSON.stringify({ action, ...options })
    });
    return res.json();
  },

  exportCases: async (role: UserRole, status?: CaseStatus) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const res = await fetch(`${API_BASE}/export/cases?${params}`, {
      headers: getHeaders(role)
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcn_cases_${Date.now()}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  exportTodos: async (role: UserRole) => {
    const res = await fetch(`${API_BASE}/export/todos`, {
      headers: getHeaders(role)
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcn_todos_${Date.now()}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  getUsers: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/users`);
    const data = await res.json();
    return data.users;
  }
};
