import { create } from 'zustand';
import { Feedback, Certificate, FlowLog } from '@/types';
import { mockFeedbacks, mockCertificates, mockUsers, currentUser } from '@/data/mockData';

interface AppState {
  users: typeof mockUsers;
  feedbacks: Feedback[];
  certificates: Certificate[];
  currentUser: typeof currentUser;
  
  updateFeedbackStatus: (feedbackId: string, newStatus: Feedback['status'], nextStep: Feedback['currentStep'], assigneeId: string, assigneeName: string) => void;
  addFlowLog: (type: 'feedback' | 'certificate', relatedId: string, log: Omit<FlowLog, 'id' | 'relatedType' | 'relatedId'>) => void;
  updateCertificateStatus: (certificateId: string, newStatus: Certificate['status'], issuedAt?: string, issuedBy?: string) => void;
  getFeedbackById: (id: string) => Feedback | undefined;
  getCertificateById: (id: string) => Certificate | undefined;
  getCertificatesByFeedbackId: (feedbackId: string) => Certificate[];
  getOverdueTasks: () => Feedback[];
  getTasksByCurrentUser: () => Feedback[];
}

export const useStore = create<AppState>((set, get) => ({
  users: mockUsers,
  feedbacks: mockFeedbacks,
  certificates: mockCertificates,
  currentUser: currentUser,

  updateFeedbackStatus: (feedbackId, newStatus, nextStep, assigneeId, assigneeName) => {
    set((state) => ({
      feedbacks: state.feedbacks.map((f) =>
        f.id === feedbackId
          ? { ...f, status: newStatus, currentStep: nextStep, assigneeId, assigneeName }
          : f
      ),
    }));
  },

  addFlowLog: (type, relatedId, log) => {
    const newLog: FlowLog = {
      ...log,
      id: `${type}-${relatedId}-${Date.now()}`,
      relatedType: type,
      relatedId,
    };

    if (type === 'feedback') {
      set((state) => ({
        feedbacks: state.feedbacks.map((f) =>
          f.id === relatedId
            ? { ...f, flowLogs: [...f.flowLogs, newLog] }
            : f
        ),
      }));
    } else {
      set((state) => ({
        certificates: state.certificates.map((c) =>
          c.id === relatedId
            ? { ...c, flowLogs: [...c.flowLogs, newLog] }
            : c
        ),
      }));
    }
  },

  updateCertificateStatus: (certificateId, newStatus, issuedAt, issuedBy) => {
    set((state) => ({
      certificates: state.certificates.map((c) =>
        c.id === certificateId
          ? {
              ...c,
              status: newStatus,
              ...(issuedAt && { issuedAt }),
              ...(issuedBy && { issuedBy }),
            }
          : c
      ),
    }));
  },

  getFeedbackById: (id) => {
    return get().feedbacks.find((f) => f.id === id);
  },

  getCertificateById: (id) => {
    return get().certificates.find((c) => c.id === id);
  },

  getCertificatesByFeedbackId: (feedbackId) => {
    return get().certificates.filter((c) => c.feedbackId === feedbackId);
  },

  getOverdueTasks: () => {
    return get().feedbacks.filter((f) => f.isOverdue && f.status !== 'completed');
  },

  getTasksByCurrentUser: () => {
    const user = get().currentUser;
    return get().feedbacks.filter(
      (f) => f.assigneeId === user.id && f.status !== 'completed'
    );
  },
}));
