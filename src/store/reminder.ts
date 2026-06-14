import { create } from 'zustand';
import type { Reminder, UserRole, User } from '../../shared/types';
import {
  fetchReminders,
  fetchUsers,
  scheduleReminder as apiSchedule,
  executeReminder as apiExecute,
  confirmFee as apiConfirmFee,
  reviewReminder as apiReview,
  markDispute as apiDispute,
  resolveDispute as apiResolveDispute,
} from '../services/api';

interface ReminderStore {
  allReminders: Reminder[];
  reminders: Reminder[];
  users: User[];
  currentRole: UserRole;
  currentUserId: string;
  filterStatus: string;
  keyword: string;
  selectedId: string | null;
  loading: boolean;

  setCurrentRole: (role: UserRole) => void;
  setFilterStatus: (status: string) => void;
  setKeyword: (keyword: string) => void;
  setSelectedId: (id: string | null) => void;
  loadReminders: () => Promise<void>;
  loadUsers: () => Promise<void>;
  scheduleReminder: (
    id: string,
    payload: { scheduledAt: string; assignedCoachId: string; remark: string }
  ) => Promise<void>;
  executeReminder: (
    id: string,
    payload: { executedAt: string; executedRemark: string }
  ) => Promise<void>;
  confirmFee: (
    id: string,
    payload: { paymentStatus: 'paid' | 'pending' | 'unpaid'; confirmedBy: string; remark: string }
  ) => Promise<void>;
  reviewReminder: (id: string, payload: { remark: string; approve: boolean }) => Promise<void>;
  markDispute: (id: string, remark: string) => Promise<void>;
  resolveDispute: (id: string, payload: { remark: string; resolveTo: string }) => Promise<void>;
  updateReminder: (r: Reminder) => void;
  applyFilter: () => void;
}

const defaultUserByRole: Record<UserRole, { id: string; name: string }> = {
  enroller: { id: 'u1', name: '王秀英' },
  coach: { id: 'u4', name: '陈志强' },
  safety_officer: { id: 'u7', name: '孙守义' },
};

export const useReminderStore = create<ReminderStore>((set, get) => ({
  allReminders: [],
  reminders: [],
  users: [],
  currentRole: 'enroller',
  currentUserId: 'u1',
  filterStatus: 'all',
  keyword: '',
  selectedId: null,
  loading: false,

  setCurrentRole: (role) => {
    set({ currentRole: role, currentUserId: defaultUserByRole[role].id });
    get().loadReminders();
  },
  setFilterStatus: (status) => {
    set({ filterStatus: status });
    get().applyFilter();
  },
  setKeyword: (keyword) => {
    set({ keyword });
    get().applyFilter();
  },
  setSelectedId: (id) => set({ selectedId: id }),

  applyFilter: () => {
    const { allReminders, filterStatus, keyword, currentUserId } = get();
    let list = allReminders;
    if (filterStatus === 'mine') {
      list = list.filter(
        (r) => r.currentOwnerId === currentUserId && r.status !== 'completed'
      );
    } else if (filterStatus !== 'all') {
      list = list.filter((r) => r.status === filterStatus);
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter(
        (r) =>
          r.student.name.toLowerCase().includes(kw) ||
          r.reason.toLowerCase().includes(kw) ||
          r.subject.toLowerCase().includes(kw)
      );
    }
    set({ reminders: list });
  },

  loadReminders: async () => {
    set({ loading: true });
    try {
      const list = await fetchReminders();
      set({ allReminders: list });
      get().applyFilter();
    } finally {
      set({ loading: false });
    }
  },

  loadUsers: async () => {
    const list = await fetchUsers();
    set({ users: list });
  },

  updateReminder: (updated) => {
    set((s) => {
      const newAll = s.allReminders.map((r) => (r.id === updated.id ? updated : r));
      return { allReminders: newAll };
    });
    get().applyFilter();
  },

  scheduleReminder: async (id, payload) => {
    const { currentUserId } = get();
    const updated = await apiSchedule(id, { ...payload, operatorId: currentUserId });
    get().updateReminder(updated);
  },

  executeReminder: async (id, payload) => {
    const { currentUserId } = get();
    const updated = await apiExecute(id, { ...payload, operatorId: currentUserId });
    get().updateReminder(updated);
  },

  confirmFee: async (id, payload) => {
    const { currentUserId } = get();
    const updated = await apiConfirmFee(id, { ...payload, operatorId: currentUserId });
    get().updateReminder(updated);
  },

  reviewReminder: async (id, payload) => {
    const { currentUserId } = get();
    const updated = await apiReview(id, { ...payload, operatorId: currentUserId });
    get().updateReminder(updated);
  },

  markDispute: async (id, remark) => {
    const { currentUserId } = get();
    const updated = await apiDispute(id, { operatorId: currentUserId, remark });
    get().updateReminder(updated);
  },

  resolveDispute: async (id, payload) => {
    const { currentUserId } = get();
    const updated = await apiResolveDispute(id, { ...payload, operatorId: currentUserId });
    get().updateReminder(updated);
  },
}));
