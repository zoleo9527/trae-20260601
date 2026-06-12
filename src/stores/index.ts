import { create } from 'zustand';
import type { Project, Document, User } from '../types';
import * as api from '../services/api';

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  pagination: { page: number; pageSize: number; total: number; totalPages: number } | null;
  loading: boolean;
  error: string | null;
  filters: { status?: string; handler?: string };
  fetchProjects: (params?: { page?: number; pageSize?: number; status?: string; handler?: string }) => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (data: Partial<Project>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  updateProjectStatus: (id: string, status: string, reason: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setFilters: (filters: { status?: string; handler?: string }) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  currentProject: null,
  pagination: null,
  loading: false,
  error: null,
  filters: {},

  fetchProjects: async (params) => {
    set({ loading: true, error: null });
    try {
      const filters = get().filters;
      const result = await api.getProjects({ ...filters, ...params });
      if (result.success && result.data) {
        set({
          projects: result.data,
          pagination: result.pagination || null,
          loading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const result = await api.getProject(id);
      if (result.success && result.data) {
        set({ currentProject: result.data, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createProject: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.createProject(data);
      await get().fetchProjects();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProject: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.updateProject(id, data);
      await get().fetchProjects();
      if (get().currentProject?.id === id) {
        await get().fetchProject(id);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateProjectStatus: async (id, status, reason) => {
    set({ loading: true, error: null });
    try {
      await api.updateProjectStatus(id, { status, reason });
      await get().fetchProjects();
      if (get().currentProject?.id === id) {
        await get().fetchProject(id);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.deleteProject(id);
      await get().fetchProjects();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  setFilters: (filters) => {
    set({ filters });
    get().fetchProjects();
  },
}));

interface DocumentStore {
  documents: Document[];
  currentDocument: Document | null;
  loading: boolean;
  error: string | null;
  fetchDocuments: (params?: { projectId?: string; status?: string }) => Promise<void>;
  fetchDocument: (id: string) => Promise<void>;
  updateDocument: (id: string, data: Partial<Document>) => Promise<void>;
  addQARecord: (documentId: string, data: { question: string; answer: string }) => Promise<void>;
  scheduleEvaluation: (documentId: string, data: { scheduledAt: string; location: string; evaluators: string[] }) => Promise<void>;
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,

  fetchDocuments: async (params) => {
    set({ loading: true, error: null });
    try {
      const result = await api.getDocuments(params);
      if (result.success && result.data) {
        set({ documents: result.data, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      const result = await api.getDocument(id);
      if (result.success && result.data) {
        set({ currentDocument: result.data, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateDocument: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.updateDocument(id, data);
      await get().fetchDocuments();
      if (get().currentDocument?.id === id) {
        await get().fetchDocument(id);
      }
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addQARecord: async (documentId, data) => {
    set({ loading: true, error: null });
    try {
      await api.addQARecord(documentId, data);
      await get().fetchDocument(documentId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  scheduleEvaluation: async (documentId, data) => {
    set({ loading: true, error: null });
    try {
      await api.scheduleEvaluation(documentId, data);
      await get().fetchDocument(documentId);
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));

interface UserStore {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: { id: 'U001', name: '张三', role: 'project_specialist' },
  setCurrentUser: (user) => set({ currentUser: user }),
}));
