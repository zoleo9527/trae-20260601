import { create } from 'zustand';
import { Project, ProjectCreateData, ProjectUpdateData, NoticeData, RefundData, User, TodoItem, ProjectStatus, NoticeStatus, RefundStatus } from '../types';
import { mockProjects as initialProjects, mockUsers } from '../data/mockData';
import { storage, getInitialTodos } from '../utils/storage';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  currentUser: User | null;
  todos: TodoItem[];

  initializeStore: () => void;
  setCurrentUser: (user: User) => void;
  login: (email: string) => void;
  logout: () => void;
  resetData: () => void;

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
  
  batchApproveNotice: (projectIds: string[]) => Promise<void>;
  batchApproveRefund: (projectIds: string[]) => Promise<void>;
  batchRejectNotice: (projectIds: string[], reason: string) => Promise<void>;
  batchRejectRefund: (projectIds: string[], reason: string) => Promise<void>;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  currentUser: null,
  todos: [],

  initializeStore: () => {
    const savedProjects = storage.getProjects();
    const savedUser = storage.getCurrentUser();
    const todos = getInitialTodos(savedProjects, savedUser);
    set({ 
      projects: savedProjects, 
      currentUser: savedUser,
      todos 
    });
  },

  setCurrentUser: (user) => {
    storage.setCurrentUser(user);
    const todos = getInitialTodos(get().projects, user);
    set({ currentUser: user, todos });
  },

  login: (email) => {
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      storage.setCurrentUser(user);
      const todos = getInitialTodos(get().projects, user);
      set({ currentUser: user, todos });
    }
  },

  logout: () => {
    storage.setCurrentUser(null);
    set({ currentUser: null, currentProject: null, todos: [] });
  },

  resetData: () => {
    storage.resetToInitialData();
    const savedProjects = storage.getProjects();
    const currentUser = get().currentUser;
    const todos = getInitialTodos(savedProjects, currentUser);
    set({ projects: savedProjects, currentProject: null, todos });
  },

  fetchProjects: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const projects = storage.getProjects();
      const todos = getInitialTodos(projects, get().currentUser);
      set({ projects, todos, loading: false });
    } catch (error) {
      set({ error: '加载项目列表失败', loading: false });
    }
  },

  fetchProjectById: async (id) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const projects = storage.getProjects();
      const project = projects.find(p => p.id === id) || null;
      set({ currentProject: project, loading: false });
    } catch (error) {
      set({ error: '加载项目详情失败', loading: false });
    }
  },

  createProject: async (data) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      const newProject: Project = {
        id: Date.now().toString(),
        name: data.name,
        code: data.code,
        status: 'draft',
        deposit_amount: data.deposit_amount,
        created_by: currentUser?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by_user: currentUser,
        activities: [{
          id: `a${Date.now()}`,
          project_id: Date.now().toString(),
          action: 'create',
          description: '创建项目',
          performed_by: currentUser?.id || '',
          created_at: new Date().toISOString(),
        }],
      };
      const projects = [...get().projects, newProject];
      storage.setProjects(projects);
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, todos, loading: false });
    } catch (error) {
      set({ error: '创建项目失败', loading: false });
    }
  },

  updateProject: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const projects = get().projects.map(p =>
        p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
      );
      storage.setProjects(projects);
      const currentProject = get().currentProject?.id === id
        ? { ...get().currentProject!, ...data, updated_at: new Date().toISOString() }
        : get().currentProject;
      const todos = getInitialTodos(projects, get().currentUser);
      set({ projects, currentProject, todos, loading: false });
    } catch (error) {
      set({ error: '更新项目失败', loading: false });
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const projects = get().projects.filter(p => p.id !== id);
      storage.setProjects(projects);
      const todos = getInitialTodos(projects, get().currentUser);
      set({ 
        projects, 
        currentProject: get().currentProject?.id === id ? null : get().currentProject, 
        todos,
        loading: false 
      });
    } catch (error) {
      set({ error: '删除项目失败', loading: false });
    }
  },

  submitNotice: async (projectId, data) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
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
        performed_by: currentUser?.id || '',
        created_at: new Date().toISOString(),
      };
      
      const updateProject = (p: Project) =>
        p.id === projectId
          ? {
              ...p,
              status: 'notice_pending' as ProjectStatus,
              notice: newNotice,
              activities: [...(p.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : p;

      const projects = get().projects.map(updateProject);
      storage.setProjects(projects);
      const currentProject = projects.find(p => p.id === projectId) || null;
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, currentProject, todos, loading: false });
    } catch (error) {
      set({ error: '提交中标通知失败', loading: false });
    }
  },

  approveNotice: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'approve_notice',
        description: '审核通过中标通知',
        performed_by: currentUser?.id || '',
        created_at: new Date().toISOString(),
      };

      const projects = get().projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              status: 'notice_approved' as ProjectStatus,
              notice: p.notice ? { ...p.notice, status: 'approved' as NoticeStatus, processed_by: currentUser?.id, processed_at: new Date().toISOString() } : undefined,
              activities: [...(p.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : p
      );
      storage.setProjects(projects);
      const currentProject = projects.find(p => p.id === projectId) || null;
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, currentProject, todos, loading: false });
    } catch (error) {
      set({ error: '审核中标通知失败', loading: false });
    }
  },

  rejectNotice: async (projectId, reason) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'reject_notice',
        description: `驳回中标通知：${reason}`,
        performed_by: currentUser?.id || '',
        created_at: new Date().toISOString(),
      };

      const projects = get().projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              status: 'notice_rejected' as ProjectStatus,
              notice: p.notice ? { ...p.notice, status: 'rejected' as NoticeStatus, reject_reason: reason, processed_by: currentUser?.id, processed_at: new Date().toISOString() } : undefined,
              activities: [...(p.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : p
      );
      storage.setProjects(projects);
      const currentProject = projects.find(p => p.id === projectId) || null;
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, currentProject, todos, loading: false });
    } catch (error) {
      set({ error: '驳回中标通知失败', loading: false });
    }
  },

  applyRefund: async (projectId, data) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      const newRefund = {
        id: `r${Date.now()}`,
        project_id: projectId,
        status: 'pending' as RefundStatus,
        amount: data.amount,
        receipt_url: data.receipt_url,
        applied_at: new Date().toISOString(),
      };
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'apply_refund',
        description: `发起退款申请，金额：${data.amount}元`,
        performed_by: currentUser?.id || '',
        created_at: new Date().toISOString(),
      };

      const projects = get().projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              status: 'refund_pending' as ProjectStatus,
              refund: newRefund,
              activities: [...(p.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : p
      );
      storage.setProjects(projects);
      const currentProject = projects.find(p => p.id === projectId) || null;
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, currentProject, todos, loading: false });
    } catch (error) {
      set({ error: '发起退款申请失败', loading: false });
    }
  },

  approveRefund: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'approve_refund',
        description: '审核通过退款申请',
        performed_by: currentUser?.id || '',
        created_at: new Date().toISOString(),
      };

      const projects = get().projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              status: 'refund_approved' as ProjectStatus,
              refund: p.refund ? { ...p.refund, status: 'approved' as RefundStatus, processed_by: currentUser?.id, processed_at: new Date().toISOString() } : undefined,
              activities: [...(p.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : p
      );
      storage.setProjects(projects);
      const currentProject = projects.find(p => p.id === projectId) || null;
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, currentProject, todos, loading: false });
    } catch (error) {
      set({ error: '审核退款申请失败', loading: false });
    }
  },

  rejectRefund: async (projectId, reason) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'reject_refund',
        description: `驳回退款申请：${reason}`,
        performed_by: currentUser?.id || '',
        created_at: new Date().toISOString(),
      };

      const projects = get().projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              status: 'refund_rejected' as ProjectStatus,
              refund: p.refund ? { ...p.refund, status: 'rejected' as RefundStatus, reject_reason: reason, processed_by: currentUser?.id, processed_at: new Date().toISOString() } : undefined,
              activities: [...(p.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : p
      );
      storage.setProjects(projects);
      const currentProject = projects.find(p => p.id === projectId) || null;
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, currentProject, todos, loading: false });
    } catch (error) {
      set({ error: '驳回退款申请失败', loading: false });
    }
  },

  processPayment: async (projectId) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      const newActivity = {
        id: `a${Date.now()}`,
        project_id: projectId,
        action: 'process_payment',
        description: '完成打款',
        performed_by: currentUser?.id || '',
        created_at: new Date().toISOString(),
      };

      const projects = get().projects.map(p =>
        p.id === projectId
          ? {
              ...p,
              status: 'paid' as ProjectStatus,
              refund: p.refund ? { ...p.refund, status: 'paid' as RefundStatus, paid_at: new Date().toISOString() } : undefined,
              activities: [...(p.activities || []), newActivity],
              updated_at: new Date().toISOString(),
            }
          : p
      );
      storage.setProjects(projects);
      const currentProject = projects.find(p => p.id === projectId) || null;
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, currentProject, todos, loading: false });
    } catch (error) {
      set({ error: '处理打款失败', loading: false });
    }
  },

  fetchTodos: async () => {
    const projects = get().projects;
    const currentUser = get().currentUser;
    const todos = getInitialTodos(projects, currentUser);
    set({ todos });
  },

  batchApproveNotice: async (projectIds) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      
      const projects = get().projects.map(p => {
        if (projectIds.includes(p.id) && p.status === 'notice_pending') {
          const newActivity = {
            id: `a${Date.now()}_${p.id}`,
            project_id: p.id,
            action: 'approve_notice',
            description: '审核通过中标通知',
            performed_by: currentUser?.id || '',
            created_at: new Date().toISOString(),
          };
          return {
            ...p,
            status: 'notice_approved' as ProjectStatus,
            notice: p.notice ? { ...p.notice, status: 'approved' as NoticeStatus, processed_by: currentUser?.id, processed_at: new Date().toISOString() } : undefined,
            activities: [...(p.activities || []), newActivity],
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      });
      
      storage.setProjects(projects);
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, todos, loading: false });
    } catch (error) {
      set({ error: '批量审核失败', loading: false });
    }
  },

  batchApproveRefund: async (projectIds) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      
      const projects = get().projects.map(p => {
        if (projectIds.includes(p.id) && p.status === 'refund_pending') {
          const newActivity = {
            id: `a${Date.now()}_${p.id}`,
            project_id: p.id,
            action: 'approve_refund',
            description: '审核通过退款申请',
            performed_by: currentUser?.id || '',
            created_at: new Date().toISOString(),
          };
          return {
            ...p,
            status: 'refund_approved' as ProjectStatus,
            refund: p.refund ? { ...p.refund, status: 'approved' as RefundStatus, processed_by: currentUser?.id, processed_at: new Date().toISOString() } : undefined,
            activities: [...(p.activities || []), newActivity],
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      });
      
      storage.setProjects(projects);
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, todos, loading: false });
    } catch (error) {
      set({ error: '批量审核失败', loading: false });
    }
  },

  batchRejectNotice: async (projectIds, reason) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      
      const projects = get().projects.map(p => {
        if (projectIds.includes(p.id) && p.status === 'notice_pending') {
          const newActivity = {
            id: `a${Date.now()}_${p.id}`,
            project_id: p.id,
            action: 'reject_notice',
            description: `驳回中标通知：${reason}`,
            performed_by: currentUser?.id || '',
            created_at: new Date().toISOString(),
          };
          return {
            ...p,
            status: 'notice_rejected' as ProjectStatus,
            notice: p.notice ? { ...p.notice, status: 'rejected' as NoticeStatus, reject_reason: reason, processed_by: currentUser?.id, processed_at: new Date().toISOString() } : undefined,
            activities: [...(p.activities || []), newActivity],
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      });
      
      storage.setProjects(projects);
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, todos, loading: false });
    } catch (error) {
      set({ error: '批量驳回失败', loading: false });
    }
  },

  batchRejectRefund: async (projectIds, reason) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const currentUser = get().currentUser;
      
      const projects = get().projects.map(p => {
        if (projectIds.includes(p.id) && p.status === 'refund_pending') {
          const newActivity = {
            id: `a${Date.now()}_${p.id}`,
            project_id: p.id,
            action: 'reject_refund',
            description: `驳回退款申请：${reason}`,
            performed_by: currentUser?.id || '',
            created_at: new Date().toISOString(),
          };
          return {
            ...p,
            status: 'refund_rejected' as ProjectStatus,
            refund: p.refund ? { ...p.refund, status: 'rejected' as RefundStatus, reject_reason: reason, processed_by: currentUser?.id, processed_at: new Date().toISOString() } : undefined,
            activities: [...(p.activities || []), newActivity],
            updated_at: new Date().toISOString(),
          };
        }
        return p;
      });
      
      storage.setProjects(projects);
      const todos = getInitialTodos(projects, currentUser);
      set({ projects, todos, loading: false });
    } catch (error) {
      set({ error: '批量驳回失败', loading: false });
    }
  },
}));
