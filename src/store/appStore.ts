import { create } from 'zustand';
import type {
  Consultation,
  ConsultationDetail,
  User,
  QueryFilter,
  CreateConsultationRequest,
  UpdateConsultationRequest,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  BatchUpdateDocumentRequest,
  DashboardStats,
  DocumentListItem,
  DocumentQueryFilter,
} from '../types';
import { api } from '../services/api';

interface AppState {
  consultations: Consultation[];
  users: User[];
  currentDetail: ConsultationDetail | null;
  currentUser: User | null;
  filter: QueryFilter;
  documentFilter: DocumentQueryFilter;
  documentList: DocumentListItem[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  docLoading: boolean;
  error: string | null;

  setCurrentUser: (user: User) => void;
  setFilter: (filter: Partial<QueryFilter>) => void;
  setDocumentFilter: (filter: Partial<DocumentQueryFilter>) => void;
  loadUsers: () => Promise<void>;
  loadConsultations: () => Promise<void>;
  loadDocumentList: () => Promise<void>;
  loadDetail: (id: number) => Promise<void>;
  clearDetail: () => void;
  loadDashboardStats: () => Promise<void>;
  createConsultation: (
    req: CreateConsultationRequest
  ) => Promise<Consultation>;
  batchCreate: (items: CreateConsultationRequest[]) => Promise<Consultation[]>;
  updateStatus: (
    req: UpdateConsultationRequest
  ) => Promise<Consultation>;
  createDocument: (req: CreateDocumentRequest) => Promise<void>;
  updateDocument: (req: UpdateDocumentRequest) => Promise<void>;
  batchUpdateDocuments: (req: BatchUpdateDocumentRequest) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  consultations: [],
  users: [],
  currentDetail: null,
  currentUser: null,
  filter: {},
  documentFilter: {},
  documentList: [],
  dashboardStats: null,
  loading: false,
  docLoading: false,
  error: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  setFilter: (newFilter) =>
    set((state) => ({ filter: { ...state.filter, ...newFilter } })),

  setDocumentFilter: (newFilter) =>
    set((state) => ({ documentFilter: { ...state.documentFilter, ...newFilter } })),

  loadUsers: async () => {
    try {
      const users = await api.getUsers();
      set({ users });
      if (!get().currentUser && users.length > 0) {
        set({ currentUser: users[0] });
      }
    } catch (error) {
      set({ error: String(error) });
    }
  },

  loadConsultations: async () => {
    set({ loading: true });
    try {
      const consultations = await api.queryConsultations(get().filter);
      set({ consultations, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  loadDocumentList: async () => {
    set({ docLoading: true });
    try {
      const documents = await api.queryDocuments(get().documentFilter);
      set({ documentList: documents, docLoading: false });
    } catch (error) {
      set({ error: String(error), docLoading: false });
    }
  },

  loadDetail: async (id) => {
    set({ loading: true });
    try {
      const detail = await api.getConsultationDetail(id);
      set({ currentDetail: detail, loading: false });
    } catch (error) {
      set({ error: String(error), loading: false });
    }
  },

  clearDetail: () => set({ currentDetail: null }),

  loadDashboardStats: async () => {
    try {
      const user = get().currentUser;
      if (!user) return;
      const stats = await api.getDashboardStats(user.name, user.role);
      set({ dashboardStats: stats });
    } catch (error) {
      set({ error: String(error) });
    }
  },

  createConsultation: async (req) => {
    const result = await api.createConsultation(req);
    await get().loadConsultations();
    return result;
  },

  batchCreate: async (items) => {
    const result = await api.batchCreateConsultations(items);
    await get().loadConsultations();
    return result;
  },

  updateStatus: async (req) => {
    const result = await api.updateConsultationStatus(req);
    await get().loadConsultations();
    await get().loadDashboardStats();
    if (get().currentDetail?.consultation.id === req.id) {
      await get().loadDetail(req.id);
    }
    return result;
  },

  createDocument: async (req) => {
    await api.createDocument(req);
    const detail = get().currentDetail;
    if (detail) {
      await get().loadDetail(detail.consultation.id);
    }
    await get().loadDocumentList();
  },

  updateDocument: async (req) => {
    await api.updateDocumentStatus(req);
    const detail = get().currentDetail;
    if (detail) {
      await get().loadDetail(detail.consultation.id);
    }
    await get().loadDocumentList();
  },

  batchUpdateDocuments: async (req) => {
    await api.batchUpdateDocumentStatus(req);
    const detail = get().currentDetail;
    if (detail) {
      await get().loadDetail(detail.consultation.id);
    }
    await get().loadDocumentList();
  },
}));
