import { invoke } from '@tauri-apps/api/core';
import type {
  User,
  Consultation,
  ConsultationDetail,
  DocumentItem,
  OperationLog,
  CreateConsultationRequest,
  UpdateConsultationRequest,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  BatchUpdateDocumentRequest,
  QueryFilter,
  UserRole,
  DashboardStats,
  DocumentListItem,
  DocumentQueryFilter,
} from '../types';

export const api = {
  getUsers: async (): Promise<User[]> => {
    return invoke('get_all_users');
  },

  getUsersByRole: async (role: UserRole): Promise<User[]> => {
    return invoke('get_users_by_role', { role });
  },

  queryConsultations: async (filter: QueryFilter): Promise<Consultation[]> => {
    return invoke('query_consultations', { filter });
  },

  getConsultationDetail: async (id: number): Promise<ConsultationDetail> => {
    return invoke('get_consultation_detail', { id });
  },

  createConsultation: async (
    req: CreateConsultationRequest
  ): Promise<Consultation> => {
    return invoke('create_consultation', { req });
  },

  batchCreateConsultations: async (
    items: CreateConsultationRequest[]
  ): Promise<Consultation[]> => {
    return invoke('batch_create_consultations', { items });
  },

  updateConsultationStatus: async (
    req: UpdateConsultationRequest
  ): Promise<Consultation> => {
    return invoke('update_consultation_status', { req });
  },

  createDocument: async (
    req: CreateDocumentRequest
  ): Promise<DocumentItem> => {
    return invoke('create_document', { req });
  },

  updateDocumentStatus: async (
    req: UpdateDocumentRequest
  ): Promise<DocumentItem> => {
    return invoke('update_document_status', { req });
  },

  batchUpdateDocumentStatus: async (
    req: BatchUpdateDocumentRequest
  ): Promise<DocumentItem[]> => {
    return invoke('batch_update_document_status', { req });
  },

  getOperationLogs: async (
    consultationId: number
  ): Promise<OperationLog[]> => {
    return invoke('get_operation_logs', { consultationId });
  },

  getDashboardStats: async (
    currentUserName: string,
    currentUserRole: string
  ): Promise<DashboardStats> => {
    return invoke('get_dashboard_stats', { currentUserName, currentUserRole });
  },

  queryDocuments: async (
    filter: DocumentQueryFilter
  ): Promise<DocumentListItem[]> => {
    return invoke('query_documents', { filter });
  },
};
