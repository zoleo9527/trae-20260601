import { useAppStore } from '@/store/appStore';
import type {
  CustomerDraft,
  PrintSchedule,
  MaterialPickup,
  InstallationRecord,
  AuditLog,
  ExceptionRecord,
  User,
} from '@/types';

export function useApi() {
  const store = useAppStore();

  const getCurrentUser = (): User => store.currentUser;

  const switchUser = (userId: string): void => store.switchUser(userId);

  const getAllUsers = (): User[] => store.users;

  const getDrafts = (): CustomerDraft[] => store.drafts;

  const getDraftById = (id: string): CustomerDraft | undefined =>
    store.drafts.find((d) => d.id === id);

  const getSchedules = (): PrintSchedule[] => store.schedules;

  const getScheduleById = (id: string): PrintSchedule | undefined =>
    store.schedules.find((s) => s.id === id);

  const getSchedulesByDraftId = (draftId: string): PrintSchedule[] =>
    store.schedules.filter((s) => s.draftId === draftId);

  const getMaterialPickups = (): MaterialPickup[] => store.materialPickups;

  const getMaterialPickupById = (id: string): MaterialPickup | undefined =>
    store.materialPickups.find((p) => p.id === id);

  const getMaterialPickupsByScheduleId = (scheduleId: string): MaterialPickup[] =>
    store.materialPickups.filter((p) => p.scheduleId === scheduleId);

  const getInstallations = (): InstallationRecord[] => store.installations;

  const getInstallationById = (id: string): InstallationRecord | undefined =>
    store.installations.find((i) => i.id === id);

  const getInstallationByScheduleId = (scheduleId: string): InstallationRecord | undefined =>
    store.installations.find((i) => i.scheduleId === scheduleId);

  const getAuditLogs = (): AuditLog[] => store.auditLogs;

  const getAuditLogsByEntity = (
    entityType: 'draft' | 'schedule' | 'material' | 'installation',
    entityId: string
  ): AuditLog[] => store.getAuditLogsByEntity(entityType, entityId);

  const getExceptions = (): ExceptionRecord[] => store.exceptions;

  const getExceptionById = (id: string): ExceptionRecord | undefined =>
    store.exceptions.find((e) => e.id === id);

  const getExceptionsByScheduleId = (scheduleId: string): ExceptionRecord[] =>
    store.exceptions.filter((e) => e.scheduleId === scheduleId);

  return {
    getCurrentUser,
    switchUser,
    getAllUsers,
    getDrafts,
    getDraftById,
    getSchedules,
    getScheduleById,
    getSchedulesByDraftId,
    getMaterialPickups,
    getMaterialPickupById,
    getMaterialPickupsByScheduleId,
    getInstallations,
    getInstallationById,
    getInstallationByScheduleId,
    getAuditLogs,
    getAuditLogsByEntity,
    getExceptions,
    getExceptionById,
    getExceptionsByScheduleId,
    createDraft: store.createDraft,
    updateDraftStatus: store.updateDraftStatus,
    createSchedule: store.createSchedule,
    updateScheduleStatus: store.updateScheduleStatus,
    createMaterialPickup: store.createMaterialPickup,
    updateMaterialPickupStatus: store.updateMaterialPickupStatus,
    createInstallationRecord: store.createInstallationRecord,
    updateInstallationStatus: store.updateInstallationStatus,
    createException: store.createException,
    resolveException: store.resolveException,
    createAuditLog: store.createAuditLog,
    generateOrderNo: store.generateOrderNo,
    generateId: store.generateId,
    resetDemoData: store.resetDemoData,
  };
}

export type ApiService = ReturnType<typeof useApi>;
