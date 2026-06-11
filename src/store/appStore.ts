import { create } from 'zustand';
import {
  Lead,
  FollowupRecord,
  StatusTransition,
  ExceptionLog,
  User,
  Role,
  LeadStatus,
} from '../types';
import * as dao from '../db/dao';
import * as leadService from '../services/leadService';
import { getDb } from '../db';

export interface AppState {
  currentUser: User | null;
  users: User[];
  leads: Lead[];
  totalLeads: number;
  currentLead: Lead | null;
  followups: FollowupRecord[];
  transitions: StatusTransition[];
  exceptions: ExceptionLog[];
  allExceptions: ExceptionLog[];
  allFollowups: FollowupRecord[];
  exceptionStats: { total: number; byType: Record<string, number> };
  loading: boolean;
  error: string | null;
  filters: {
    status?: LeadStatus[];
    keyword?: string;
    hasException?: boolean;
    priority?: ('high' | 'medium' | 'low')[];
  };
  page: number;
  pageSize: number;

  init: () => Promise<void>;
  loadCurrentUser: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  loadLeads: (filters?: Partial<AppState['filters']>) => Promise<void>;
  loadLeadDetail: (leadId: string) => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: Partial<AppState['filters']>) => void;

  createLead: (
    data: Parameters<typeof leadService.createLead>[0]
  ) => Promise<leadService.TransitionResult>;
  executeTransition: (
    req: leadService.TransitionRequest
  ) => Promise<leadService.TransitionResult>;
  returnLead: (
    leadId: string,
    reason: string
  ) => Promise<leadService.TransitionResult>;
  reassignLead: (
    leadId: string,
    newResponsibleId: string,
    newResponsibleRole: Role,
    reason: string
  ) => Promise<void>;
  flagException: (
    leadId: string,
    followupId: string | null,
    type: any,
    message: string
  ) => Promise<ExceptionLog>;
  handleException: (exceptionId: string, remark: string) => Promise<void>;
  scanForGaps: () => Promise<ExceptionLog[]>;
  loadExceptionStats: () => Promise<void>;
  loadAllExceptions: () => Promise<void>;
  loadAllFollowups: () => Promise<void>;

  createFollowup: (
    data: Partial<FollowupRecord> & { leadId: string }
  ) => Promise<string>;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  leads: [],
  totalLeads: 0,
  currentLead: null,
  followups: [],
  transitions: [],
  exceptions: [],
  allExceptions: [],
  allFollowups: [],
  exceptionStats: { total: 0, byType: {} },
  loading: false,
  error: null,
  filters: {},
  page: 1,
  pageSize: 50,

  init: async () => {
    try {
      set({ loading: true, error: null });
      await getDb();
      await get().loadCurrentUser();
      await get().loadUsers();
      await get().loadLeads();
      await get().loadExceptionStats();
      await get().loadAllExceptions();
      await get().loadAllFollowups();
      await get().scanForGaps();
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  loadCurrentUser: async () => {
    const user = await dao.getCurrentUser();
    set({ currentUser: user });
  },

  switchUser: async (userId: string) => {
    await dao.setCurrentUser(userId);
    await get().loadCurrentUser();
    await get().loadLeads();
  },

  loadUsers: async () => {
    const users = await dao.getAllUsers();
    set({ users });
  },

  loadLeads: async (filters) => {
    const currentFilters = { ...get().filters, ...filters };
    set({ filters: currentFilters, loading: true });
    try {
      const { data, total } = await dao.getLeads({
        ...currentFilters,
        page: get().page,
        pageSize: get().pageSize,
      });
      set({ leads: data, totalLeads: total });
    } finally {
      set({ loading: false });
    }
  },

  loadLeadDetail: async (leadId: string) => {
    set({ loading: true });
    try {
      const [lead, followups, transitions, exceptions] = await Promise.all([
        dao.getLeadById(leadId),
        dao.getFollowupsByLeadId(leadId),
        dao.getTransitionsByLeadId(leadId),
        dao.getExceptionsByLeadId(leadId),
      ]);
      set({ currentLead: lead, followups, transitions, exceptions });
    } finally {
      set({ loading: false });
    }
  },

  setPage: (page) => {
    set({ page });
    get().loadLeads();
  },

  setFilters: (filters) => {
    const newFilters = { ...get().filters, ...filters };
    set({ filters: newFilters, page: 1 });
    get().loadLeads();
  },

  createLead: async (data) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('未登录');
    const result = await leadService.createLead(data, currentUser);
    await get().loadLeads();
    return {
      success: true,
      errors: [],
      warnings: [],
      lead: result,
    };
  },

  executeTransition: async (req) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('未登录');
    const result = await leadService.executeStatusTransition(
      req,
      currentUser
    );
    if (result.success) {
      await get().loadLeads();
      if (req.leadId === get().currentLead?.id) {
        await get().loadLeadDetail(req.leadId);
      }
      await get().loadExceptionStats();
      await get().loadAllExceptions();
    }
    return result;
  },

  returnLead: async (leadId, reason) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('未登录');
    const result = await leadService.returnLead(leadId, reason, currentUser);
    if (result.success) {
      await get().loadLeads();
      if (leadId === get().currentLead?.id) {
        await get().loadLeadDetail(leadId);
      }
      await get().loadExceptionStats();
      await get().loadAllExceptions();
    }
    return result;
  },

  reassignLead: async (leadId, newResponsibleId, newResponsibleRole, reason) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('未登录');
    await leadService.reassignLead(
      leadId,
      newResponsibleId,
      newResponsibleRole,
      reason,
      currentUser
    );
    await get().loadLeads();
    if (leadId === get().currentLead?.id) {
      await get().loadLeadDetail(leadId);
    }
    await get().loadExceptionStats();
    await get().loadAllExceptions();
    await get().loadAllFollowups();
  },

  flagException: async (leadId, followupId, type, message) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('未登录');
    const result = await leadService.flagException(
      leadId,
      followupId,
      type,
      message,
      currentUser
    );
    await get().loadLeads();
    if (leadId === get().currentLead?.id) {
      await get().loadLeadDetail(leadId);
    }
    await get().loadExceptionStats();
    await get().loadAllExceptions();
    return result;
  },

  handleException: async (exceptionId, remark) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('未登录');
    await leadService.handleException(exceptionId, remark, currentUser);
    if (get().currentLead) {
      await get().loadLeadDetail(get().currentLead!.id);
    }
    await get().loadLeads();
    await get().loadExceptionStats();
    await get().loadAllExceptions();
  },

  scanForGaps: async () => {
    const result = await leadService.scanForGaps();
    await get().loadExceptionStats();
    await get().loadAllExceptions();
    if (result.length > 0) {
      await get().loadLeads();
    }
    return result;
  },

  loadExceptionStats: async () => {
    const stats = await dao.getExceptionStats();
    set({ exceptionStats: stats });
  },

  loadAllExceptions: async () => {
    const exceptions = await dao.getUnhandledExceptions();
    set({ allExceptions: exceptions });
  },

  loadAllFollowups: async () => {
    const followups = await dao.getAllFollowups();
    set({ allFollowups: followups });
  },

  createFollowup: async (data) => {
    const { currentUser } = get();
    if (!currentUser) throw new Error('未登录');
    const now = new Date().toISOString();
    const followup: Omit<FollowupRecord, 'id'> = {
      leadId: data.leadId,
      type: data.type || 'other',
      content: data.content || '',
      location: data.location,
      scheduledAt: data.scheduledAt || null,
      startedAt: data.startedAt || now,
      completedAt: data.completedAt || null,
      status: data.status || 'in_progress',
      handledBy: currentUser.id,
      handledRole: currentUser.role,
      nextAction: data.nextAction || '',
      nextActionAt: data.nextActionAt || null,
      nextResponsible: data.nextResponsible || null,
      nextResponsibleRole: data.nextResponsibleRole || null,
      createdAt: now,
      updatedAt: now,
      attachments: data.attachments || [],
    };
    const id = await dao.insertFollowup(followup);
    if (data.leadId === get().currentLead?.id) {
      await get().loadLeadDetail(data.leadId);
    }
    await get().loadAllFollowups();
    return id;
  },
}));
