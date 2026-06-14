import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Claim,
  Handler,
  AppSettings,
  BackupRecord,
  AppData,
  ClaimStatus,
  ActionType,
  WorkflowLog,
  UrgeRecord,
  SupplementMaterial,
  CompensationCalc,
  ResponsibilityInfo,
} from '@/types';
import {
  generateId,
  generateCaseNumber,
  calculateStuckPoint,
  calculateDurationHours,
  ACTION_TO_STATUS,
  canPerformAction,
  canTransition,
  calculateChecksum,
  SAME_STATE_ACTIONS,
} from '@/utils/workflow';
import { mockClaims, mockHandlers, mockSettings } from '@/utils/mockData';
import { saveData, loadData, removeData, exportBackup as exportBackupToStorage } from '@/utils/storage';
import { persistStorage } from '@/utils/persistStorage';

interface AppState {
  claims: Claim[];
  handlers: Handler[];
  settings: AppSettings;
  backups: BackupRecord[];
  currentUserId: string;
  setCurrentUserId: (id: string) => void;

  addClaim: (claim: Partial<Claim>) => Claim;
  updateClaim: (id: string, updates: Partial<Claim>) => void;
  deleteClaim: (id: string) => void;

  performAction: (
    claimId: string,
    actionType: ActionType,
    reason: string,
    options?: {
      supplementMaterials?: Partial<SupplementMaterial>[];
      compensationCalc?: Partial<CompensationCalc>;
      targetHandlerId?: string;
    }
  ) => void;

  getResponsibilityInfo: (claimId: string) => ResponsibilityInfo;
  getClaimsByStatus: (status: ClaimStatus) => Claim[];
  getClaimsByHandler: (handlerId: string) => Claim[];

  createBackup: (name: string) => Promise<BackupRecord>;
  restoreFromBackup: (backupId: string) => Promise<void>;
  deleteBackup: (backupId: string) => Promise<void>;
  exportBackup: (backupId: string) => Promise<string>;
  importBackup: (content: string) => Promise<BackupRecord>;
  autoBackup: () => Promise<BackupRecord | null>;
  cleanupExpiredBackups: () => Promise<number>;

  updateSettings: (updates: Partial<AppSettings>) => void;
  resetData: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      claims: mockClaims,
      handlers: mockHandlers,
      settings: mockSettings,
      backups: [],
      currentUserId: mockSettings.currentUserId,

      setCurrentUserId: (id: string) => set({ currentUserId: id }),

      addClaim: (claimData) => {
        const currentUser = get().handlers.find((h) => h.id === get().currentUserId);
        const newClaim: Claim = {
          id: generateId(),
          caseNumber: generateCaseNumber(),
          policyNumber: claimData.policyNumber || '',
          claimantName: claimData.claimantName || '',
          accidentType: claimData.accidentType || '',
          accidentDescription: claimData.accidentDescription || '',
          claimAmount: claimData.claimAmount || 0,
          status: 'pending',
          currentHandlerId: get().currentUserId,
          currentHandlerRole: currentUser?.role || 'specialist',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stuckReason: '',
          urgeCount: 0,
          workflowLogs: [],
          urgeRecords: [],
          supplementMaterials: [],
          ...claimData,
        };

        const createLog: WorkflowLog = {
          id: generateId(),
          claimId: newClaim.id,
          actionType: 'create',
          fromStatus: null,
          toStatus: 'pending',
          handlerId: get().currentUserId,
          handlerRole: currentUser?.role || 'specialist',
          reason: '案件立案，提交核赔审批',
          createdAt: new Date().toISOString(),
          durationHours: 0,
        };
        newClaim.workflowLogs.push(createLog);

        set((state) => ({
          claims: [...state.claims, newClaim],
        }));

        return newClaim;
      },

      updateClaim: (id, updates) =>
        set((state) => ({
          claims: state.claims.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),

      deleteClaim: (id) =>
        set((state) => ({
          claims: state.claims.filter((c) => c.id !== id),
        })),

      performAction: (claimId, actionType, reason, options = {}) => {
        const state = get();
        const currentUser = state.handlers.find((h) => h.id === state.currentUserId);
        if (!currentUser) return;

        if (!canPerformAction(actionType, currentUser.role)) {
          throw new Error(`当前用户角色无权限执行此操作: ${actionType}`);
        }

        const claim = state.claims.find((c) => c.id === claimId);
        if (!claim) return;

        const toStatus = ACTION_TO_STATUS[actionType];
        const isSameStateAction = SAME_STATE_ACTIONS.includes(actionType);

        if (!isSameStateAction && toStatus && !canTransition(claim.status, toStatus)) {
          throw new Error(`无法从 ${claim.status} 转换到 ${toStatus}`);
        }

        const now = new Date().toISOString();
        const lastLog = claim.workflowLogs[claim.workflowLogs.length - 1];
        const durationHours = lastLog
          ? calculateDurationHours(lastLog.createdAt, now)
          : calculateDurationHours(claim.createdAt, now);

        const targetStatus = isSameStateAction ? claim.status : (toStatus as ClaimStatus);

        const workflowLog: WorkflowLog = {
          id: generateId(),
          claimId,
          actionType,
          fromStatus: claim.status,
          toStatus: targetStatus,
          handlerId: state.currentUserId,
          handlerRole: currentUser.role,
          reason,
          createdAt: now,
          durationHours,
        };

        let updates: Partial<Claim> = {
          status: targetStatus,
          workflowLogs: [...claim.workflowLogs, workflowLog],
          updatedAt: now,
        };

        if (actionType === 'urge') {
          updates.urgeCount = claim.urgeCount + 1;
          updates.stuckReason = reason;

          if (options.targetHandlerId) {
            const urgeRecord: UrgeRecord = {
              id: generateId(),
              claimId,
              operatorId: state.currentUserId,
              targetHandlerId: options.targetHandlerId,
              message: reason,
              createdAt: now,
            };
            updates.urgeRecords = [...claim.urgeRecords, urgeRecord];
          }
        }

        if (actionType === 'supplement' && options.supplementMaterials) {
          const materials: SupplementMaterial[] = options.supplementMaterials.map((m) => ({
            id: generateId(),
            claimId,
            name: m.name || '',
            description: m.description || '',
            requesterId: state.currentUserId,
            providerId: m.providerId || claim.currentHandlerId,
            status: 'pending',
            requestedAt: now,
          }));
          updates.supplementMaterials = [...claim.supplementMaterials, ...materials];
          updates.stuckReason = `待补充材料：${materials.map((m) => m.name).join('、')}`;
        }

        if (actionType === 'material_ok') {
          updates.supplementMaterials = claim.supplementMaterials.map((m) =>
            m.status === 'pending' ? { ...m, status: 'provided', providedAt: now } : m
          );
          updates.stuckReason = '';
        }

        if (actionType === 'reject') {
          updates.stuckReason = reason;
        }

        if (actionType === 'approve') {
          updates.stuckReason = '';
          const nextHandler = state.handlers.find((h) => h.role === 'specialist');
          if (nextHandler) {
            updates.currentHandlerId = nextHandler.id;
            updates.currentHandlerRole = nextHandler.role;
          }
        }

        if ((actionType === 'start_calc' || actionType === 'update_calc') && options.compensationCalc) {
          const existingCalc = claim.compensationCalc;
          const calc: CompensationCalc = {
            id: existingCalc?.id || generateId(),
            claimId,
            handlerId: state.currentUserId,
            items: options.compensationCalc.items || [],
            totalAmount: options.compensationCalc.items?.reduce((sum, item) => sum + item.amount, 0) || 0,
            formula: options.compensationCalc.formula || '',
            remark: options.compensationCalc.remark || '',
            calculatedAt: existingCalc?.calculatedAt || '',
          };
          updates.compensationCalc = calc;
          updates.currentHandlerId = state.currentUserId;
          updates.currentHandlerRole = currentUser.role;
        }

        if (actionType === 'finish_calc') {
          if (options.compensationCalc) {
            const existingCalc = claim.compensationCalc;
            const calc: CompensationCalc = {
              id: existingCalc?.id || generateId(),
              claimId,
              handlerId: state.currentUserId,
              items: options.compensationCalc.items || [],
              totalAmount: options.compensationCalc.items?.reduce((sum, item) => sum + item.amount, 0) || 0,
              formula: options.compensationCalc.formula || '',
              remark: options.compensationCalc.remark || '',
              calculatedAt: now,
            };
            updates.compensationCalc = calc;
          } else if (claim.compensationCalc) {
            updates.compensationCalc = {
              ...claim.compensationCalc,
              calculatedAt: now,
            };
          }
          updates.stuckReason = '';
        }

        set((s) => ({
          claims: s.claims.map((c) => (c.id === claimId ? { ...c, ...updates } : c)),
        }));
      },

      getResponsibilityInfo: (claimId) => {
        const state = get();
        const claim = state.claims.find((c) => c.id === claimId);
        if (!claim) {
          return { currentHandler: null, stuckPoint: '', reason: '案件不存在' };
        }

        const stuckInfo = calculateStuckPoint(claim, state.handlers);

        let stuckPoint = '';
        switch (claim.status) {
          case 'pending':
            stuckPoint = '核赔审批环节';
            break;
          case 'urged':
            stuckPoint = '催办响应环节';
            break;
          case 'returned':
            stuckPoint = '退回修改环节';
            break;
          case 'supplement':
            stuckPoint = '材料补充环节';
            break;
          case 'approved':
            stuckPoint = '待进入赔付计算';
            break;
          case 'calculating':
            stuckPoint = '赔付计算环节';
            break;
          case 'completed':
            stuckPoint = '已完成';
            break;
          default:
            stuckPoint = '未知环节';
        }

        return {
          currentHandler: stuckInfo.handler,
          stuckPoint,
          reason: stuckInfo.reason,
        };
      },

      getClaimsByStatus: (status) => get().claims.filter((c) => c.status === status),

      getClaimsByHandler: (handlerId) => get().claims.filter((c) => c.currentHandlerId === handlerId),

      createBackup: async (name) => {
        const state = get();
        const now = new Date().toISOString();
        const dataStr = JSON.stringify(state.claims);
        const checksum = calculateChecksum(dataStr);

        const backup: BackupRecord = {
          id: generateId(),
          name,
          createdAt: now,
          size: new Blob([dataStr]).size,
          itemCount: state.claims.length,
        };

        const appData: AppData = {
          claims: state.claims,
          handlers: state.handlers,
          settings: state.settings,
          backups: [...state.backups, backup],
          version: '1.0.0',
          checksum,
        };

        await saveData(`backup_${backup.id}`, JSON.stringify(appData));

        set((s) => ({
          backups: [...s.backups, backup],
        }));

        return backup;
      },

      restoreFromBackup: async (backupId) => {
        const backupData = await loadData(`backup_${backupId}`);
        if (!backupData) throw new Error('备份不存在');

        const appData: AppData = JSON.parse(backupData);
        const dataStr = JSON.stringify(appData.claims);
        const checksum = calculateChecksum(dataStr);

        if (checksum !== appData.checksum) {
          throw new Error('备份数据校验失败，可能已损坏');
        }

        set({
          claims: appData.claims,
          handlers: appData.handlers,
          settings: appData.settings,
          backups: appData.backups,
        });
      },

      deleteBackup: async (backupId) => {
        await removeData(`backup_${backupId}`);
        set((s) => ({
          backups: s.backups.filter((b) => b.id !== backupId),
        }));
      },

      exportBackup: async (backupId) => {
        const backupData = await loadData(`backup_${backupId}`);
        if (!backupData) throw new Error('备份不存在');

        const path = await exportBackupToStorage(backupData);
        return path;
      },

      importBackup: async (content) => {
        const appData: AppData = JSON.parse(content);
        const dataStr = JSON.stringify(appData.claims);
        const checksum = calculateChecksum(dataStr);

        if (checksum !== appData.checksum) {
          throw new Error('导入数据校验失败，可能已损坏');
        }

        const newBackup: BackupRecord = {
          id: generateId(),
          name: `导入备份_${new Date().toLocaleString('zh-CN')}`,
          createdAt: new Date().toISOString(),
          size: new Blob([content]).size,
          itemCount: appData.claims.length,
        };

        await saveData(`backup_${newBackup.id}`, content);

        set((s) => ({
          backups: [...s.backups, newBackup],
        }));

        return newBackup;
      },

      autoBackup: async () => {
        const state = get();
        if (!state.settings.autoBackup) {
          return null;
        }

        const today = new Date().toISOString().slice(0, 10);
        const hasTodayAutoBackup = state.backups.some((b) => {
          const backupDate = new Date(b.createdAt).toISOString().slice(0, 10);
          return backupDate === today && b.name.startsWith('自动备份_');
        });

        if (hasTodayAutoBackup) {
          return null;
        }

        const backupName = `自动备份_${new Date().toLocaleString('zh-CN')}`;
        const backup = await state.createBackup(backupName);

        await state.cleanupExpiredBackups();

        return backup;
      },

      cleanupExpiredBackups: async () => {
        const state = get();
        const { autoBackup, autoBackupDays } = state.settings;

        if (!autoBackup) {
          return 0;
        }

        const now = new Date().getTime();
        const expireMs = autoBackupDays * 24 * 60 * 60 * 1000;

        const expiredAutoBackups = state.backups.filter((b) => {
          if (!b.name.startsWith('自动备份_')) {
            return false;
          }
          const backupTime = new Date(b.createdAt).getTime();
          return now - backupTime > expireMs;
        });

        for (const backup of expiredAutoBackups) {
          await removeData(`backup_${backup.id}`);
        }

        if (expiredAutoBackups.length > 0) {
          const expiredIds = new Set(expiredAutoBackups.map((b) => b.id));
          set((s) => ({
            backups: s.backups.filter((b) => !expiredIds.has(b.id)),
          }));
        }

        return expiredAutoBackups.length;
      },

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      resetData: () => {
        set({
          claims: mockClaims,
          handlers: mockHandlers,
          settings: mockSettings,
          currentUserId: mockSettings.currentUserId,
        });
      },
    }),
    {
      name: 'insurance-claim-center-storage',
      storage: persistStorage,
      partialize: (state) => ({
        claims: state.claims,
        handlers: state.handlers,
        settings: state.settings,
        backups: state.backups,
        currentUserId: state.currentUserId,
      }),
    }
  )
);
