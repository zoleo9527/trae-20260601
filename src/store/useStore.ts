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
  createCertificates: (feedbackId: string, activityId: string, activityName: string, recipientNames: string[]) => void;
  switchUser: (userId: string) => void;
  getFeedbackById: (id: string) => Feedback | undefined;
  getCertificateById: (id: string) => Certificate | undefined;
  getCertificatesByFeedbackId: (feedbackId: string) => Certificate[];
  getOverdueTasks: () => Feedback[];
  getTasksByCurrentUser: () => Feedback[];
  getNextTask: (currentId: string) => Feedback | undefined;
  getPrevTask: (currentId: string) => Feedback | undefined;
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

  createCertificates: (feedbackId, activityId, activityName, recipientNames) => {
    const newCertificates: Certificate[] = recipientNames.map((name, index) => ({
      id: `c-${Date.now()}-${index}`,
      feedbackId,
      activityId,
      activityName,
      recipientName: name,
      status: 'ready',
      issueMethod: 'onsite',
      flowLogs: [
        {
          id: `cert-log-${Date.now()}-${index}`,
          relatedType: 'certificate',
          relatedId: `c-${Date.now()}-${index}`,
          operatorId: get().currentUser.id,
          operatorName: get().currentUser.name,
          action: 'create',
          remark: '审核通过，自动生成证书草稿',
          timestamp: new Date().toLocaleString('zh-CN'),
        },
      ],
    }));

    set((state) => ({
      certificates: [...state.certificates, ...newCertificates],
    }));
  },

  switchUser: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user });
    }
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
    return get().feedbacks
      .filter((f) => f.assigneeId === user.id && f.status !== 'completed')
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      });
  },

  getNextTask: (currentId) => {
    const myTasks = get().getTasksByCurrentUser();
    const currentIndex = myTasks.findIndex((f) => f.id === currentId);
    return myTasks[currentIndex + 1];
  },

  getPrevTask: (currentId) => {
    const myTasks = get().getTasksByCurrentUser();
    const currentIndex = myTasks.findIndex((f) => f.id === currentId);
    return myTasks[currentIndex - 1];
  },

  getCurrentTaskIndex: (currentId) => {
    const myTasks = get().getTasksByCurrentUser();
    return myTasks.findIndex((f) => f.id === currentId);
  },
}));