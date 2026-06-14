import { 
  ExamBatch, 
  ExamBatchStatus, 
  StudentNotification, 
  StudentNotificationStatus,
  ExceptionRecord,
  ExceptionType,
  OperationLog,
  Student,
  User,
  RoleType
} from '../types';

const API_BASE = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

const currentUser = {
  id: 'u1',
  name: '张三',
  role: 'registrar' as RoleType,
};

export const apiClient = {
  async getExamBatches(status?: ExamBatchStatus): Promise<ExamBatch[]> {
    const url = status ? `${API_BASE}/batches?status=${status}` : `${API_BASE}/batches`;
    const response = await fetch(url);
    const result: ApiResponse<ExamBatch[]> = await response.json();
    return result.success ? result.data || [] : [];
  },

  async getExamBatchById(id: string): Promise<ExamBatch | null> {
    const response = await fetch(`${API_BASE}/batches/${id}`);
    const result: ApiResponse<ExamBatch> = await response.json();
    return result.success ? result.data || null : null;
  },

  async createExamBatch(data: {
    examDate: string;
    examTime: string;
    location: string;
    students: string[];
  }): Promise<{ success: boolean; data?: ExamBatch; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
      }),
    });
    return await response.json();
  },

  async submitExamBatch(id: string): Promise<{ success: boolean; data?: ExamBatch; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/batches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'submit',
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
      }),
    });
    return await response.json();
  },

  async confirmExamBatch(id: string, role: RoleType = 'trainer'): Promise<{ success: boolean; data?: ExamBatch; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/batches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'confirm',
        operatorId: role === 'trainer' ? 'u2' : 'u3',
        operatorName: role === 'trainer' ? '李四' : '王五',
        operatorRole: role,
      }),
    });
    return await response.json();
  },

  async completeExam(id: string): Promise<{ success: boolean; data?: ExamBatch; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/batches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        operatorId: 'u3',
        operatorName: '王五',
        operatorRole: 'safety_officer',
      }),
    });
    return await response.json();
  },

  async cancelExamBatch(id: string, role: RoleType = 'trainer'): Promise<{ success: boolean; data?: ExamBatch; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/batches/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cancel',
        operatorId: role === 'trainer' ? 'u2' : 'u3',
        operatorName: role === 'trainer' ? '李四' : '王五',
        operatorRole: role,
      }),
    });
    return await response.json();
  },

  async getNotifications(batchId?: string, status?: StudentNotificationStatus): Promise<StudentNotification[]> {
    let url = `${API_BASE}/notifications`;
    if (batchId) url += `?batchId=${batchId}`;
    if (status) url += `${batchId ? '&' : '?'}status=${status}`;
    
    const response = await fetch(url);
    const result: ApiResponse<StudentNotification[]> = await response.json();
    return result.success ? result.data || [] : [];
  },

  async getNotificationById(id: string): Promise<StudentNotification | null> {
    const response = await fetch(`${API_BASE}/notifications/${id}`);
    const result: ApiResponse<StudentNotification> = await response.json();
    return result.success ? result.data || null : null;
  },

  async sendNotification(id: string): Promise<{ success: boolean; data?: StudentNotification; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        operatorId: 'u2',
        operatorName: '李四',
        operatorRole: 'trainer',
      }),
    });
    return await response.json();
  },

  async confirmNotification(id: string): Promise<{ success: boolean; data?: StudentNotification; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'confirm',
        operatorId: 'u3',
        operatorName: '王五',
        operatorRole: 'safety_officer',
      }),
    });
    return await response.json();
  },

  async markAbsent(id: string, remarks?: string): Promise<{ success: boolean; data?: StudentNotification; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'absent',
        operatorId: 'u2',
        operatorName: '李四',
        operatorRole: 'trainer',
        remarks,
      }),
    });
    return await response.json();
  },

  async completeNotification(id: string): Promise<{ success: boolean; data?: StudentNotification; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        operatorId: 'u2',
        operatorName: '李四',
        operatorRole: 'trainer',
      }),
    });
    return await response.json();
  },

  async getExceptions(batchId?: string, type?: ExceptionType, resolved?: boolean): Promise<ExceptionRecord[]> {
    let url = `${API_BASE}/exceptions`;
    const params = [];
    if (batchId) params.push(`batchId=${batchId}`);
    if (type) params.push(`type=${type}`);
    if (resolved !== undefined) params.push(`resolved=${resolved}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const response = await fetch(url);
    const result: ApiResponse<ExceptionRecord[]> = await response.json();
    return result.success ? result.data || [] : [];
  },

  async getExceptionById(id: string): Promise<ExceptionRecord | null> {
    const response = await fetch(`${API_BASE}/exceptions/${id}`);
    const result: ApiResponse<ExceptionRecord> = await response.json();
    return result.success ? result.data || null : null;
  },

  async handleException(id: string): Promise<{ success: boolean; data?: ExceptionRecord; error?: { code: string; message: string } }> {
    const response = await fetch(`${API_BASE}/exceptions/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operatorId: currentUser.id,
        operatorName: currentUser.name,
        operatorRole: currentUser.role,
      }),
    });
    return await response.json();
  },

  async getOperationLogs(targetType?: 'batch' | 'notification' | 'exception', targetId?: string): Promise<OperationLog[]> {
    let url = `${API_BASE}/logs`;
    const params = [];
    if (targetType) params.push(`targetType=${targetType}`);
    if (targetId) params.push(`targetId=${targetId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    
    const response = await fetch(url);
    const result: ApiResponse<OperationLog[]> = await response.json();
    return result.success ? result.data || [] : [];
  },

  async getStudents(): Promise<Student[]> {
    const response = await fetch(`${API_BASE}/students`);
    const result: ApiResponse<Student[]> = await response.json();
    return result.success ? result.data || [] : [];
  },

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE}/users`);
    const result: ApiResponse<User[]> = await response.json();
    return result.success ? result.data || [] : [];
  },
};