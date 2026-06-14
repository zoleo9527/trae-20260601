import { create } from 'zustand';
import type { DamageAssessment, DamageDetail, CreateAssessmentParams, AssessmentFilter } from '../types/assessment.types';
import { AssessmentService } from '../services/assessment.service';

interface AssessmentState {
  assessments: DamageAssessment[];
  currentAssessment: DamageAssessment | null;
  currentDetails: DamageDetail[];
  loading: boolean;
  error: string | null;
  filters: AssessmentFilter;
  stats: {
    pending: number;
    approved: number;
    rejected: number;
  };

  fetchAssessments: (filters?: AssessmentFilter) => Promise<void>;
  fetchAssessmentDetail: (assessmentId: string) => Promise<void>;
  createAssessment: (params: CreateAssessmentParams) => Promise<void>;
  reviewAssessment: (assessmentId: string, action: 'approve' | 'reject', reviewComment: string, remark?: string) => Promise<void>;
  setFilters: (filters: AssessmentFilter) => void;
  fetchStats: () => Promise<void>;
  clearCurrentAssessment: () => void;
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  assessments: [],
  currentAssessment: null,
  currentDetails: [],
  loading: false,
  error: null,
  filters: {},
  stats: {
    pending: 0,
    approved: 0,
    rejected: 0
  },

  fetchAssessments: async (filters?: AssessmentFilter) => {
    set({ loading: true, error: null });
    try {
      const service = new AssessmentService();
      const result = service.getAssessments(filters);
      set({ assessments: result.list, loading: false, filters: filters || {} });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchAssessmentDetail: async (assessmentId: string) => {
    set({ loading: true, error: null });
    try {
      const service = new AssessmentService();
      const assessment = service.getAssessmentById(assessmentId);
      const details = assessment ? service.getDetailsByAssessmentId(assessmentId) : [];
      set({ currentAssessment: assessment || null, currentDetails: details, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  createAssessment: async (params: CreateAssessmentParams) => {
    set({ loading: true, error: null });
    try {
      const service = new AssessmentService();
      await service.createAssessment(params);
      await get().fetchAssessments();
      await get().fetchStats();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  reviewAssessment: async (assessmentId: string, action: 'approve' | 'reject', reviewComment: string, remark?: string) => {
    set({ loading: true, error: null });
    try {
      const service = new AssessmentService();
      const updatedAssessment = await service.reviewAssessment(assessmentId, action, reviewComment, remark);
      set({ currentAssessment: updatedAssessment });
      await get().fetchAssessments();
      await get().fetchStats();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  setFilters: (filters: AssessmentFilter) => {
    set({ filters });
  },

  fetchStats: async () => {
    try {
      const service = new AssessmentService();
      const stats = service.getAssessmentStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  clearCurrentAssessment: () => {
    set({ currentAssessment: null, currentDetails: [] });
  }
}));
