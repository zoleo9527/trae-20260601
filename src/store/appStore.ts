import { create } from 'zustand';
import dayjs from 'dayjs';
import type {
  User,
  CustomerDraft,
  PrintSchedule,
  MaterialPickup,
  InstallationRecord,
  AuditLog,
  ExceptionRecord,
  UserRole,
  PrintScheduleStatus,
  CustomerDraftStatus,
  MaterialPickupStatus,
  InstallationStatus,
  MaterialItem,
} from '@/types';
import {
  seedUsers,
  seedCustomerDrafts,
  seedPrintSchedules,
  seedMaterialPickups,
  seedInstallationRecords,
  seedAuditLogs,
  seedExceptionRecords,
} from '@/data/seedData';
import {
  validateScheduleStatusFlow,
  validateDraftStatusFlow,
  validateMaterialPickupFlow,
  validateInstallationFlow,
  actionDisplayMap,
} from '@/utils/stateMachine';
import {
  loadPersistedData,
  savePersistedData,
  clearPersistedData,
  type PersistedData,
} from '@/services/storage';

const exceptionTypeMap: Record<string, string> = {
  size_error: '尺寸错误',
  color_complaint: '色差投诉',
  install_time_change: '安装时间变更',
  other: '其他问题',
};

function getInitialState() {
  const persisted = loadPersistedData();
  if (persisted) {
    const currentUser =
      persisted.users.find((u) => u.id === persisted.currentUserId) || seedUsers[0];
    return {
      currentUser,
      users: persisted.users,
      drafts: persisted.drafts,
      schedules: persisted.schedules,
      materialPickups: persisted.materialPickups,
      installations: persisted.installations,
      auditLogs: persisted.auditLogs,
      exceptions: persisted.exceptions,
    };
  }
  return {
    currentUser: seedUsers[0],
    users: seedUsers,
    drafts: seedCustomerDrafts,
    schedules: seedPrintSchedules,
    materialPickups: seedMaterialPickups,
    installations: seedInstallationRecords,
    auditLogs: seedAuditLogs,
    exceptions: seedExceptionRecords,
  };
}

interface AppState {
  currentUser: User;
  users: User[];
  drafts: CustomerDraft[];
  schedules: PrintSchedule[];
  materialPickups: MaterialPickup[];
  installations: InstallationRecord[];
  auditLogs: AuditLog[];
  exceptions: ExceptionRecord[];
  persist: () => void;
  setCurrentUser: (user: User) => void;
  switchUser: (userId: string) => void;
  createAuditLog: (
    entityType: 'draft' | 'schedule' | 'material' | 'installation',
    entityId: string,
    action: AuditLog['action'],
    detail: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ) => void;
  createDraft: (draft: Omit<CustomerDraft, 'id' | 'createdAt' | 'status'>) => void;
  updateDraftStatus: (
    draftId: string,
    targetStatus: CustomerDraftStatus,
    remark?: string
  ) => boolean;
  createSchedule: (
    schedule: Omit<
      PrintSchedule,
      'id' | 'scheduleNo' | 'submittedAt' | 'status' | 'submittedBy' | 'submittedAt'
    >
  ) => PrintSchedule | null;
  updateScheduleStatus: (
    scheduleId: string,
    targetStatus: PrintScheduleStatus,
    remark?: string
  ) => boolean;
  createMaterialPickup: (
    pickup: Omit<MaterialPickup, 'id' | 'pickupNo' | 'status' | 'pickedAt' | 'pickedBy'> & {
      items: MaterialItem[];
      totalAmount: number;
    }
  ) => void;
  updateMaterialPickupStatus: (
    pickupId: string,
    targetStatus: MaterialPickupStatus
  ) => boolean;
  createInstallationRecord: (
    installation: Omit<
      InstallationRecord,
      'id' | 'status' | 'createdAt' | 'createdBy'
    > & {
      createdBy: string;
    }
  ) => InstallationRecord;
  updateInstallationStatus: (
    installationId: string,
    targetStatus: InstallationStatus,
    updates?: Partial<InstallationRecord>
  ) => boolean;
  createException: (
    exception: Omit<ExceptionRecord, 'id' | 'reportedAt' | 'status' | 'reportedBy'>
  ) => void;
  resolveException: (exceptionId: string, resolution: string) => void;
  getAuditLogsByEntity: (
    entityType: 'draft' | 'schedule' | 'material' | 'installation',
    entityId: string
  ) => AuditLog[];
  generateId: (prefix: string) => string;
  generateOrderNo: (prefix: string) => string;
  resetDemoData: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  ...getInitialState(),

  persist: () => {
    const state = get();
    const data: PersistedData = {
      currentUserId: state.currentUser.id,
      users: state.users,
      drafts: state.drafts,
      schedules: state.schedules,
      materialPickups: state.materialPickups,
      installations: state.installations,
      auditLogs: state.auditLogs,
      exceptions: state.exceptions,
    };
    savePersistedData(data);
  },

  setCurrentUser: (user) => {
    set({ currentUser: user });
    get().persist();
  },

  switchUser: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user });
      get().persist();
    }
  },

  generateId: (prefix) => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  generateOrderNo: (prefix) => {
    const date = dayjs().format('YYYYMMDD');
    const count =
      prefix === 'PH'
        ? get().schedules.length + 1
        : prefix === 'CK'
        ? get().materialPickups.length + 1
        : prefix === 'DD'
        ? get().drafts.length + 1
        : 1;
    return `${prefix}${date}${String(count).padStart(3, '0')}`;
  },

  createAuditLog: (entityType, entityId, action, detail, oldValues, newValues) => {
    const { currentUser } = get();
    const log: AuditLog = {
      id: get().generateId('log'),
      entityType,
      entityId,
      action,
      operatorId: currentUser.id,
      operatorName: currentUser.name,
      operatorRole: currentUser.role,
      timestamp: dayjs().toISOString(),
      detail,
      oldValues,
      newValues,
    };
    set((state) => ({
      auditLogs: [log, ...state.auditLogs],
    }));
    get().persist();
  },

  createDraft: (draft) => {
    const { currentUser, createAuditLog, generateId, generateOrderNo } = get();
    const newDraft: CustomerDraft = {
      ...draft,
      id: generateId('draft'),
      status: 'pending_review',
      createdAt: dayjs().toISOString(),
      createdBy: currentUser.id,
    };
    set((state) => ({
      drafts: [newDraft, ...state.drafts],
    }));
    createAuditLog(
      'draft',
      newDraft.id,
      'draft_create',
      `${currentUser.name}创建客户稿件 ${newDraft.orderNo}`,
      undefined,
      {
        customerName: draft.customerName,
        content: draft.content,
        width: draft.width,
        height: draft.height,
      }
    );
    get().persist();
  },

  updateDraftStatus: (draftId, targetStatus, remark) => {
    const { currentUser, drafts, createAuditLog } = get();
    const draft = drafts.find((d) => d.id === draftId);
    if (!draft) return false;

    if (!validateDraftStatusFlow(draft.status, targetStatus, currentUser.role)) {
      return false;
    }

    const oldStatus = draft.status;
    set((state) => ({
      drafts: state.drafts.map((d) =>
        d.id === draftId
          ? {
              ...d,
              status: targetStatus,
              remark: remark || d.remark,
              reviewedBy:
                targetStatus === 'approved' || targetStatus === 'rejected'
                  ? currentUser.id
                  : d.reviewedBy,
              reviewedAt:
                targetStatus === 'approved' || targetStatus === 'rejected'
                  ? dayjs().toISOString()
                  : d.reviewedAt,
            }
          : d
      ),
    }));

    let action: AuditLog['action'] = 'draft_create';
    if (targetStatus === 'approved') action = 'draft_review';
    else if (targetStatus === 'rejected') action = 'draft_reject';
    else if (targetStatus === 'size_issue') action = 'draft_size_issue';
    else if (targetStatus === 'color_issue') action = 'draft_color_issue';

    createAuditLog(
      'draft',
      draftId,
      action,
      `${currentUser.name}${actionDisplayMap[action]} ${draft.orderNo}${
        remark ? `，备注：${remark}` : ''
      }`,
      { status: oldStatus },
      { status: targetStatus }
    );

    return true;
  },

  createSchedule: (schedule) => {
    const { currentUser, createAuditLog, generateId, generateOrderNo, createInstallationRecord } =
      get();

    if (
      currentUser.role !== 'reception' &&
      currentUser.role !== 'manager'
    ) {
      return null;
    }

    const scheduleNo = generateOrderNo('PH');
    const now = dayjs().toISOString();

    const newSchedule: PrintSchedule = {
      ...schedule,
      id: generateId('schedule'),
      scheduleNo,
      status: 'submitted',
      submittedBy: currentUser.id,
      submittedAt: now,
    };

    set((state) => ({
      schedules: [newSchedule, ...state.schedules],
    }));

    const draftExceptions = get().exceptions.filter(
      (e) =>
        (e.scheduleId === '' &&
          (e.scheduleNo === newSchedule.orderNo ||
            e.scheduleNo === newSchedule.draftId)) ||
        e.scheduleId === newSchedule.draftId
    );
    if (draftExceptions.length > 0) {
      set((state) => ({
        exceptions: state.exceptions.map((e) => {
          if (
            (e.scheduleId === '' &&
              (e.scheduleNo === newSchedule.orderNo ||
                e.scheduleNo === newSchedule.draftId)) ||
            e.scheduleId === newSchedule.draftId
          ) {
            return {
              ...e,
              scheduleId: newSchedule.id,
              scheduleNo: newSchedule.scheduleNo,
            };
          }
          return e;
        }),
      }));

      draftExceptions.forEach((e) => {
        createAuditLog(
          'schedule',
          newSchedule.id,
          'exception_create',
          `稿件异常自动挂接：${
            exceptionTypeMap[e.type] || e.type
          } - ${e.description}（稿件审核阶段上报）`,
          undefined,
          {
            exceptionId: e.id,
            type: e.type,
            description: e.description,
            migratedFrom: 'draft_' + newSchedule.draftId,
          }
        );
      });
    }

    createAuditLog(
      'schedule',
      newSchedule.id,
      'schedule_submit',
      `${currentUser.name}提交喷绘排产 ${scheduleNo}`,
      undefined,
      {
        customerName: schedule.customerName,
        content: schedule.content,
        quantity: schedule.quantity,
        priority: schedule.priority,
        status: 'submitted',
      }
    );

    const installation = createInstallationRecord({
      scheduleId: newSchedule.id,
      scheduleNo: newSchedule.scheduleNo,
      scheduledDate: schedule.scheduledInstallDate,
      installers: [],
      photos: [],
      customerSigned: false,
      remark: schedule.remark,
      createdBy: currentUser.id,
    });

    createAuditLog(
      'installation',
      installation.id,
      'install_schedule',
      `${currentUser.name}安排安装 ${newSchedule.scheduleNo}，计划日期: ${schedule.scheduledInstallDate}`,
      undefined,
      {
        scheduleNo: newSchedule.scheduleNo,
        scheduledDate: schedule.scheduledInstallDate,
      }
    );

    get().persist();
    return newSchedule;
  },

  updateScheduleStatus: (scheduleId, targetStatus, remark) => {
    const { currentUser, schedules, createAuditLog, materialPickups } = get();
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return false;

    if (!validateScheduleStatusFlow(schedule.status, targetStatus, currentUser.role)) {
      return false;
    }

    if (targetStatus === 'material_confirmed') {
      const pickups = materialPickups.filter((p) => p.scheduleId === scheduleId);
      const hasConfirmed = pickups.some((p) => p.status === 'confirmed');
      if (!hasConfirmed) {
        if (typeof window !== 'undefined') {
          console.warn('无法推进到材料已确认：请先登记并确认材料领用');
        }
        return false;
      }
    }

    const oldStatus = schedule.status;
    const now = dayjs().toISOString();

    const updates: Partial<PrintSchedule> = {
      status: targetStatus,
      remark: remark || schedule.remark,
    };

    if (targetStatus === 'submitted') {
      updates.submittedBy = currentUser.id;
      updates.submittedAt = now;
    } else if (targetStatus === 'material_confirmed') {
      updates.materialConfirmedBy = currentUser.id;
      updates.materialConfirmedAt = now;
    } else if (targetStatus === 'printing') {
      updates.printingStartedBy = currentUser.id;
      updates.printingStartedAt = now;
    } else if (targetStatus === 'printed') {
      updates.printedBy = currentUser.id;
      updates.printedAt = now;
    } else if (targetStatus === 'completed') {
      updates.completedBy = currentUser.id;
      updates.completedAt = now;
      updates.actualInstallDate = dayjs().format('YYYY-MM-DD');
    }

    set((state) => ({
      schedules: state.schedules.map((s) =>
        s.id === scheduleId ? { ...s, ...updates } : s
      ),
    }));

    let action: AuditLog['action'] = 'schedule_submit';
    if (targetStatus === 'submitted') action = 'schedule_submit';
    else if (targetStatus === 'material_confirmed')
      action = 'schedule_material_confirm';
    else if (targetStatus === 'printing') action = 'schedule_start_print';
    else if (targetStatus === 'printed') action = 'schedule_complete_print';
    else if (targetStatus === 'installing') action = 'schedule_start_install';
    else if (targetStatus === 'completed') action = 'schedule_complete';
    else if (targetStatus === 'cancelled') action = 'schedule_cancel';

    createAuditLog(
      'schedule',
      scheduleId,
      action,
      `${currentUser.name}${actionDisplayMap[action]} ${schedule.scheduleNo}${
        remark ? `，备注：${remark}` : ''
      }`,
      { status: oldStatus },
      { status: targetStatus }
    );

    get().persist();
    return true;
  },

  createMaterialPickup: (pickup) => {
    const { currentUser, createAuditLog, generateId, generateOrderNo } = get();
    const pickupNo = generateOrderNo('CK');
    const newPickup: MaterialPickup = {
      ...pickup,
      id: generateId('pickup'),
      pickupNo,
      status: 'pending',
      pickedBy: currentUser.id,
      pickedAt: dayjs().toISOString(),
    };
    set((state) => ({
      materialPickups: [newPickup, ...state.materialPickups],
    }));
    createAuditLog(
      'material',
      newPickup.id,
      'material_pickup',
      `${currentUser.name}登记材料领用 ${pickupNo}`,
      undefined,
      {
        items: pickup.items.map(
          (i) => `${i.materialType} ${i.quantity}${i.unit}`
        ),
        totalAmount: pickup.totalAmount,
      }
    );
    get().persist();
  },

  updateMaterialPickupStatus: (pickupId, targetStatus) => {
    const { currentUser, materialPickups, createAuditLog } = get();
    const pickup = materialPickups.find((p) => p.id === pickupId);
    if (!pickup) return false;

    if (!validateMaterialPickupFlow(pickup.status, targetStatus, currentUser.role)) {
      return false;
    }

    const oldStatus = pickup.status;
    const now = dayjs().toISOString();

    const updates: Partial<MaterialPickup> = {
      status: targetStatus,
    };

    if (targetStatus === 'confirmed') {
      updates.confirmedBy = currentUser.id;
      updates.confirmedAt = now;
    } else if (targetStatus === 'returned') {
      updates.returnedBy = currentUser.id;
      updates.returnedAt = now;
    }

    set((state) => ({
      materialPickups: state.materialPickups.map((p) =>
        p.id === pickupId ? { ...p, ...updates } : p
      ),
    }));

    const action: AuditLog['action'] =
      targetStatus === 'confirmed' ? 'material_confirm' : 'material_return';

    createAuditLog(
      'material',
      pickupId,
      action,
      `${currentUser.name}${actionDisplayMap[action]} ${pickup.pickupNo}`,
      { status: oldStatus },
      { status: targetStatus }
    );

    get().persist();
    return true;
  },

  createInstallationRecord: (installation) => {
    const { generateId } = get();
    const newInstallation: InstallationRecord = {
      ...installation,
      id: generateId('install'),
      status: 'scheduled',
      createdAt: dayjs().toISOString(),
    };
    set((state) => ({
      installations: [newInstallation, ...state.installations],
    }));
    get().persist();
    return newInstallation;
  },

  updateInstallationStatus: (installationId, targetStatus, updates) => {
    const { currentUser, installations, createAuditLog } = get();
    const installation = installations.find((i) => i.id === installationId);
    if (!installation) return false;

    if (!validateInstallationFlow(installation.status, targetStatus, currentUser.role)) {
      return false;
    }

    const oldStatus = installation.status;
    const now = dayjs().toISOString();

    const finalUpdates: Partial<InstallationRecord> = {
      ...updates,
      status: targetStatus,
      updatedBy: currentUser.id,
      updatedAt: now,
    };

    if (targetStatus === 'completed') {
      finalUpdates.actualDate = dayjs().format('YYYY-MM-DD');
    }

    set((state) => ({
      installations: state.installations.map((i) =>
        i.id === installationId ? { ...i, ...finalUpdates } : i
      ),
    }));

    let action: AuditLog['action'] = 'install_start';
    if (targetStatus === 'time_changed') action = 'install_time_change';
    else if (targetStatus === 'in_progress') action = 'install_start';
    else if (targetStatus === 'completed') action = 'install_complete';
    else if (targetStatus === 'failed') action = 'install_fail';

    const detail = updates?.scheduledDate
      ? `${currentUser.name}${actionDisplayMap[action]}，新安装时间：${updates.scheduledDate}`
      : `${currentUser.name}${actionDisplayMap[action]}`;

    createAuditLog(
      'installation',
      installationId,
      action,
      `${detail} ${installation.scheduleNo}`,
      { status: oldStatus },
      { status: targetStatus, ...updates }
    );

    get().persist();
    return true;
  },

  createException: (exception) => {
    const { currentUser, generateId, createAuditLog } = get();
    const newException: ExceptionRecord = {
      ...exception,
      id: generateId('exception'),
      status: 'pending',
      reportedBy: currentUser.id,
      reportedAt: dayjs().toISOString(),
    };
    set((state) => ({
      exceptions: [newException, ...state.exceptions],
    }));

    createAuditLog(
      'schedule',
      newException.scheduleId,
      'exception_create',
      `${currentUser.name}上报异常：${
        exceptionTypeMap[newException.type] || newException.type
      } - ${newException.description}`,
      undefined,
      {
        exceptionId: newException.id,
        type: newException.type,
        description: newException.description,
      }
    );

    get().persist();
  },

  resolveException: (exceptionId, resolution) => {
    const { currentUser, createAuditLog } = get();
    let exception: ExceptionRecord | undefined;
    set((state) => ({
      exceptions: state.exceptions.map((e) => {
        if (e.id === exceptionId) {
          exception = e;
          return {
            ...e,
            status: 'resolved',
            handledBy: currentUser.id,
            handledAt: dayjs().toISOString(),
            resolution,
          };
        }
        return e;
      }),
    }));

    if (exception) {
      createAuditLog(
        'schedule',
        exception.scheduleId,
        'exception_resolve',
        `${currentUser.name}处理异常：${
          exceptionTypeMap[(exception as ExceptionRecord).type] ||
          (exception as ExceptionRecord).type
        }，解决方案：${resolution}`,
        { status: 'pending' },
        { status: 'resolved', resolution }
      );
    }
    get().persist();
  },

  getAuditLogsByEntity: (entityType, entityId) => {
    return get()
      .auditLogs.filter(
        (log) => log.entityType === entityType && log.entityId === entityId
      )
      .sort(
        (a, b) =>
          dayjs(b.timestamp).valueOf() - dayjs(a.timestamp).valueOf()
      );
  },

  resetDemoData: () => {
    clearPersistedData();
    set({
      currentUser: seedUsers[0],
      users: seedUsers,
      drafts: [...seedCustomerDrafts],
      schedules: [...seedPrintSchedules],
      materialPickups: [...seedMaterialPickups],
      installations: [...seedInstallationRecords],
      auditLogs: [...seedAuditLogs],
      exceptions: [...seedExceptionRecords],
    });
  },
}));
