import { create } from 'zustand';
import { Project, ProjectCreateData, ProjectUpdateData, NoticeData, RefundData, User, TodoItem, ProjectStatus } from '../types';
import { mockProjects, mockUsers, mockTodos } from '../data/mockData';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  currentUser: User | null;
  todos: TodoItem[];

  setCurrentUser: (user: User) => void;
  login: (email: string) => void;
  logout: () => void;

  fetchProjects: () => Promise<void>;
  fetchProjectById: (id: string) => Promise<void>;
  createProject: (data: ProjectCreateData) => Promise<void>;
  updateProject: (id: string, data: ProjectUpdateData) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  submitNotice: (projectId: string, data: NoticeData) => Promise<void>;
  approveNotice: (projectId: string) => Promise<void>;
  rejectNotice: (projectId: string, reason: string) => Promise<void>;

  applyRefund: (projectId: string, data: RefundData) => Promise<void>;
  approveRefund: (projectId: string) => Promise<void>;
  rejectRefund: (projectId: string, reason: string) => Promise<void>;
  processPayment: (projectId: string) => Promise<void>;

  fetchTodos: () => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  currentUser: null,
  todos: [],

  setCurrentUser: (user) => set({ currentUser: user }),

  login: (email) => {
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      set({ currentUser: user });
    }
  },

  logout: () => set({ currentUser: null, currentProject: null }),

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ projects: mockProjects, loading: false });
    } catch (error) {
      set({ error: '加载项目列表失败', loading: false });
    }
  },

  fetchProjectById: async (id) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const project = mockProjects.find(p => p.id === id);
      set({ currentProject: project || null, loading: false });
    } catch (error) {
      set({ error: '加载项目详情失败', loading: false });
    }
  },

  createProject: async (data) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newProject: Project = {
        id: Date.now().toString(),
        name: data.name,
        code: data.code,
        status: 'draft',
        deposit_amount: data.deposit_amount,
        created_by: get().currentUser?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_user: get().currentUser,
        activities: [{
          id: Date.now().toString(),
          project_id: Date.now().toString(),
          action: 'create',
          description: '创建项目',
          performed_by: get().currentUser?.id || '',
          created_at: new Date().toISOString(),
        }],
      };
      set(state => ({ projects: [...state.projects, newProject], loading: false }));
    } catch (error) {
      set({ error: '创建项目失败', loading: false });
    }
  },

  updateProject: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      set(state => ({
        projects: state.projects.map(p =>
          p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
        ),
        currentProject: state.currentProject?.id === id
          ? { ...state.currentProject, ...data, updated_at: new Date().toISOString() }
          : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      set({ error: '更新项目失败', loading: false });
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      set(state => ({
        projects: state.projects.filter(p => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      set({ error: '删除项目失败', loading: false });
    }
  },

  submitNotice: async (projectId, data) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newNotice = {
        id: `n${Date.now()}`,
        project_id: projectId,
        status: 'pending' as const,
        file_url: data.file_url,
        submitted_at: new Date().toISOString(),
      };
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'submit_notice',
        description: '提交中标通知',
        performed_by: get().currentUser?.id || '',
        created_at: new Date().toISOString(),
      };
      set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                status: 'notice_pending' as ProjectStatus,
                notice: newNotice,
                activities: [...(p.activities || []), newActivity],
                updated_at: new Date().toISOString(),
              }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              status: 'notice_pending' as ProjectStatus,
              notice: newNotice,
              activities: [...(state.currentProject.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      set({ error: '提交中标通知失败', loading: false });
    }
  },

  approveNotice: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'approve_notice',
        description: '审核通过中标通知',
        performed_by: get().currentUser?.id || '',
        created_at: new Date().toISOString(),
      };
      set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                status: 'notice_approved' as ProjectStatus,
                notice: p.notice ? { ...p.notice, status: 'approved', processed_by: get().currentUser?.id, processed_at: new Date().toISOString() } : undefined,
                activities: [...(p.activities || []), newActivity],
                updated_at: new Date().toISOString(),
              }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              status: 'notice_approved' as ProjectStatus,
              notice: state.currentProject.notice ? { ...state.currentProject.notice, status: 'approved', processed_by: get().currentUser?.id, processed_at: new Date().toISOString() } : undefined,
              activities: [...(state.currentProject.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      set({ error: '审核中标通知失败', loading: false });
    }
  },

  rejectNotice: async (projectId, reason) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'reject_notice',
        description: `驳回中标通知：${reason}`,
        performed_by: get().currentUser?.id || '',
        created_at: new Date().toISOString(),
      };
      set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                status: 'notice_rejected' as ProjectStatus,
                notice: p.notice ? { ...p.notice, status: 'rejected', reject_reason: reason, processed_by: get().currentUser?.id, processed_at: new Date().toISOString() } : undefined,
                activities: [...(p.activities || []), newActivity],
                updated_at: new Date().toISOString(),
              }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              status: 'notice_rejected' as ProjectStatus,
              notice: state.currentProject.notice ? { ...state.currentProject.notice, status: 'rejected', reject_reason: reason, processed_by: get().currentUser?.id, processed_at: new Date().toISOString() } : undefined,
              activities: [...(state.currentProject.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      set({ error: '驳回中标通知失败', loading: false });
    }
  },

  applyRefund: async (projectId, data) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newRefund = {
        id: `r${Date.now()}`,
        project_id: projectId,
        status: 'pending' as const,
        amount: data.amount,
        receipt_url: data.receipt_url,
        applied_at: new Date().toISOString(),
      };
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'apply_refund',
        description: `发起退款申请，金额：${data.amount}元`,
        performed_by: get().currentUser?.id || '',
        created_at: new Date().toISOString(),
      };
      set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                status: 'refund_pending' as ProjectStatus,
                refund: newRefund,
                activities: [...(p.activities || []), newActivity],
                updated_at: new Date().toISOString(),
              }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              status: 'refund_pending' as ProjectStatus,
              refund: newRefund,
              activities: [...(state.currentProject.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      set({ error: '发起退款申请失败', loading: false });
    }
  },

  approveRefund: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'approve_refund',
        description: '审核通过退款申请',
        performed_by: get().currentUser?.id || '',
        created_at: new Date().toISOString(),
      };
      set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                status: 'refund_approved' as ProjectStatus,
                refund: p.refund ? { ...p.refund, status: 'approved', processed_by: get().currentUser?.id, processed_at: new Date().toISOString() } : undefined,
                activities: [...(p.activities || []), newActivity],
                updated_at: new Date().toISOString(),
              }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              status: 'refund_approved' as ProjectStatus,
              refund: state.currentProject.refund ? { ...state.currentProject.refund, status: 'approved', processed_by: get().currentUser?.id, processed_at: new Date().toISOString() } : undefined,
              activities: [...(state.currentProject.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      set({ error: '审核退款申请失败', loading: false });
    }
  },

  rejectRefund: async (projectId, reason) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'reject_refund',
        description: `驳回退款申请：${reason}`,
        performed_by: get().currentUser?.id || '',
        created_at: new Date().toISOString(),
      };
      set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                status: 'refund_rejected' as ProjectStatus,
                refund: p.refund ? { ...p.refund, status: 'rejected', reject_reason: reason, processed_by: get().currentUser?.id, processed_at: new Date().toISOString() } : undefined,
                activities: [...(p.activities || []), newActivity],
                updated_at: new Date().toISOString(),
              }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              status: 'refund_rejected' as ProjectStatus,
              refund: state.currentProject.refund ? { ...state.currentProject.refund, status: 'rejected', reject_reason: reason, processed_by: get().currentUser?.id, processed_at: new Date().toISOString() } : undefined,
              activities: [...(state.currentProject.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      set({ error: '驳回退款申请失败', loading: false });
    }
  },

  processPayment: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'process_payment',
        description: '完成打款',
        performed_by: get().currentUser?.id || '',
        created_at: new Date().toISOString(),
      };
      set(state => ({
        projects: state.projects.map(p =>
          p.id === projectId
            ? {
                ...p,
                status: 'paid' as ProjectStatus,
                refund: p.refund ? { ...p.refund, status: 'paid', paid_at: new Date().toISOString() } : undefined,
                activities: [...(p.activities || []), newActivity],
                updated_at: new Date().toISOString(),
              }
            : p
        ),
        currentProject: state.currentProject?.id === projectId
          ? {
              ...state.currentProject,
              status: 'paid' as ProjectStatus,
              refund: state.currentProject.refund ? { ...state.currentProject.refund, status: 'paid', paid_at: new Date().toISOString() } : undefined,
              activities: [...(state.currentProject.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : state.currentProject,
        loading: false,
      }));
    } catch (error) {
      set({ error: '处理打款失败', loading: false });
    }
  },

  fetchTodos: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ todos: mockTodos, loading: false });
    } catch (error) {
      set({ error: '加载待办事项失败', loading: false });
    }
  },
}));
