import { create } from 'zustand';
import type {
  UserRole,
  Complaint,
  ActionRequest,
  CreateComplaintRequest,
  CreateCompensationRequest,
} from '../../shared/types';

interface AppState {
  currentRole: UserRole;
  currentUserName: string;
  todos: Complaint[];
  complaints: Complaint[];
  selectedComplaint: Complaint | null;
  loading: boolean;
  setRole: (role: UserRole, name: string) => void;
  fetchTodos: () => Promise<void>;
  fetchComplaints: (filters?: { status?: string; type?: string }) => Promise<void>;
  fetchComplaintDetail: (id: string) => Promise<Complaint | null>;
  createComplaint: (data: CreateComplaintRequest) => Promise<Complaint>;
  executeAction: (id: string, action: Omit<ActionRequest, 'operatorRole' | 'operatorName'>) => Promise<void>;
  proposeCompensation: (id: string, data: Omit<CreateCompensationRequest, 'proposedBy'>) => Promise<void>;
  updateComplaint: (id: string, data: Partial<CreateComplaintRequest>) => Promise<void>;
}

const API_BASE = '/api';

const roleUserNames: Record<UserRole, string> = {
  reception: '李前台',
  coach: '陈教练',
  manager: '王店长',
};

export const useStore = create<AppState>((set, get) => ({
  currentRole: 'manager',
  currentUserName: '王店长',
  todos: [],
  complaints: [],
  selectedComplaint: null,
  loading: false,

  setRole: (role: UserRole, name: string) => {
    set({ currentRole: role, currentUserName: name });
    get().fetchTodos();
  },

  fetchTodos: async () => {
    const { currentRole } = get();
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/todos/${currentRole}`);
      const data = await res.json();
      set({ todos: data, loading: false });
    } catch (e) {
      console.error('获取待办失败:', e);
      set({ loading: false });
    }
  },

  fetchComplaints: async (filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      const res = await fetch(`${API_BASE}/complaints?${params.toString()}`);
      const data = await res.json();
      set({ complaints: data, loading: false });
    } catch (e) {
      console.error('获取投诉列表失败:', e);
      set({ loading: false });
    }
  },

  fetchComplaintDetail: async (id: string) => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/complaints/${id}`);
      const data = await res.json();
      set({ selectedComplaint: data, loading: false });
      return data;
    } catch (e) {
      console.error('获取投诉详情失败:', e);
      set({ loading: false });
      return null;
    }
  },

  createComplaint: async (data: CreateComplaintRequest) => {
    const { currentRole, currentUserName } = get();
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        handlerRole: currentRole,
        handlerName: currentUserName,
      }),
    });
    const result = await res.json();
    await get().fetchTodos();
    return result;
  },

  executeAction: async (id, action) => {
    const { currentRole, currentUserName } = get();
    await fetch(`${API_BASE}/complaints/${id}/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...action,
        operatorRole: currentRole,
        operatorName: currentUserName,
      }),
    });
    await get().fetchComplaintDetail(id);
    await get().fetchTodos();
    await get().fetchComplaints();
  },

  proposeCompensation: async (id, data) => {
    const { currentRole, currentUserName } = get();
    await fetch(`${API_BASE}/complaints/${id}/compensations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        proposedBy: currentUserName,
        operatorRole: currentRole,
        operatorName: currentUserName,
      }),
    });
    await get().fetchComplaintDetail(id);
    await get().fetchTodos();
  },

  updateComplaint: async (id, data) => {
    await fetch(`${API_BASE}/complaints/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    await get().fetchComplaintDetail(id);
  },
}));

export { roleUserNames };
