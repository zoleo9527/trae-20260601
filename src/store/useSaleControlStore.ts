import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SaleControl,
  OperationLog,
  OperationType,
  HouseStatus,
  ControlStage,
  Remark,
  User,
  StageRecord,
} from '../types';
import { saleControls, operationLogs, getCustomerById } from '../data';
import { STAGE_MAP, OPERATION_TYPE_MAP, ROLE_MAP } from '../utils/status';
import { generateId } from '../utils/id';
import { useUserStore } from './useUserStore';
import { useHouseStore } from './useHouseStore';

interface SaleControlFilters {
  stage?: ControlStage;
  operatorId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

interface LogFilters {
  operationType?: OperationType;
  operatorId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

interface CreateSaleControlData {
  houseId: string;
  customerId: string;
  remark: string;
  lockDuration: number;
}

interface SaleControlStore {
  saleControls: SaleControl[];
  operationLogs: OperationLog[];
  currentSaleControl: SaleControl | null;
  filters: SaleControlFilters;
  filteredSaleControls: SaleControl[];
  logFilters: LogFilters;
  filteredLogs: OperationLog[];
  createSaleControl: (data: CreateSaleControlData) => SaleControl;
  submitForReview: (id: string, remark?: string) => void;
  reviewApprove: (id: string, remark?: string) => void;
  reviewReject: (id: string, remark: string) => void;
  lockHouse: (id: string, duration: number, remark?: string) => void;
  completeSale: (id: string, remark?: string) => void;
  updateRemark: (id: string, remark: string, source?: string) => void;
  getSaleControlLogs: (id: string) => OperationLog[];
  setFilters: (filters: Partial<SaleControlFilters>) => void;
  setLogFilters: (filters: Partial<LogFilters>) => void;
  setCurrentSaleControl: (saleControl: SaleControl | null) => void;
  getSaleControlById: (id: string) => SaleControl | undefined;
  getPreviousRemark: (id: string, currentStage: ControlStage) => Remark | undefined;
  getStageRecord: (id: string, stage: ControlStage) => StageRecord | undefined;
}

const defaultFilters: SaleControlFilters = {
  stage: undefined,
  operatorId: undefined,
  startDate: undefined,
  endDate: undefined,
  keyword: undefined,
};

const defaultLogFilters: LogFilters = {
  operationType: undefined,
  operatorId: undefined,
  startDate: undefined,
  endDate: undefined,
  keyword: undefined,
};

function filterSaleControls(
  saleControls: SaleControl[],
  filters: SaleControlFilters
): SaleControl[] {
  return saleControls.filter((sc) => {
    if (filters.stage && sc.stage !== filters.stage) return false;
    if (filters.operatorId) {
      const hasOperator =
        sc.applicantId === filters.operatorId ||
        sc.currentHandlerId === filters.operatorId;
      if (!hasOperator) return false;
    }
    if (filters.startDate) {
      const scDate = new Date(sc.createdAt).getTime();
      const startDate = new Date(filters.startDate).getTime();
      if (scDate < startDate) return false;
    }
    if (filters.endDate) {
      const scDate = new Date(sc.createdAt).getTime();
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (scDate > endDate.getTime()) return false;
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      const match =
        sc.house.houseNumber.toLowerCase().includes(keyword) ||
        sc.customer.name.toLowerCase().includes(keyword) ||
        sc.applicant.name.toLowerCase().includes(keyword) ||
        sc.currentRemark.toLowerCase().includes(keyword) ||
        sc.id.toLowerCase().includes(keyword);
      if (!match) return false;
    }
    return true;
  });
}

function filterLogs(
  logs: OperationLog[],
  filters: LogFilters
): OperationLog[] {
  return logs.filter((log) => {
    if (filters.operationType && log.operationType !== filters.operationType) return false;
    if (filters.operatorId && log.operatorId !== filters.operatorId) return false;
    if (filters.startDate) {
      const logDate = new Date(log.timestamp).getTime();
      const startDate = new Date(filters.startDate).getTime();
      if (logDate < startDate) return false;
    }
    if (filters.endDate) {
      const logDate = new Date(log.timestamp).getTime();
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (logDate > endDate.getTime()) return false;
    }
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      const match =
        log.operationTypeName.toLowerCase().includes(keyword) ||
        log.operatorName.toLowerCase().includes(keyword) ||
        (log.remark && log.remark.toLowerCase().includes(keyword));
      if (!match) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function createOperationLog(
  saleControlId: string,
  operator: User,
  operationType: OperationType,
  beforeStatus: HouseStatus,
  afterStatus: HouseStatus,
  beforeStage: ControlStage | undefined,
  afterStage: ControlStage | undefined,
  beforeHandlerId?: string,
  beforeHandlerName?: string,
  afterHandlerId?: string,
  afterHandlerName?: string,
  remark?: string,
  remarkSource?: string,
  remarkInherited?: boolean
): OperationLog {
  return {
    id: `log_${generateId()}`,
    saleControlId,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    operatorRoleName: ROLE_MAP[operator.role],
    operationType,
    operationTypeName: OPERATION_TYPE_MAP[operationType],
    beforeStatus,
    afterStatus,
    beforeStage,
    afterStage,
    beforeHandlerId,
    beforeHandlerName,
    afterHandlerId,
    afterHandlerName,
    remark,
    remarkSource,
    remarkInherited,
    timestamp: new Date().toISOString(),
  };
}

function createRemark(
  content: string,
  source: string,
  sourceName: string,
  operator: User,
  stage: ControlStage,
  inheritedFrom?: string
): Remark {
  return {
    id: `r_${generateId()}`,
    content,
    source,
    sourceName,
    operatorId: operator.id,
    operatorName: operator.name,
    operatorRole: operator.role,
    operatorRoleName: ROLE_MAP[operator.role],
    timestamp: new Date().toISOString(),
    stage,
    stageName: STAGE_MAP[stage],
    inheritedFrom,
  };
}

function createStageRecord(
  stage: ControlStage,
  handler: User,
  receivedAt: string,
  completedAt?: string,
  remark?: string
): StageRecord {
  return {
    stage,
    stageName: STAGE_MAP[stage],
    handlerId: handler.id,
    handlerName: handler.name,
    handlerRole: handler.role,
    handlerRoleName: ROLE_MAP[handler.role],
    receivedAt,
    completedAt,
    remark,
  };
}

function getManagers(): User[] {
  return useUserStore.getState().getUsersByRole('manager');
}

function getControllers(): User[] {
  return useUserStore.getState().getUsersByRole('controller');
}

function getPreviousStageRemarks(sc: SaleControl, currentStage: ControlStage): Remark | undefined {
  const stageOrder: ControlStage[] = ['application', 'review', 'lock', 'completed'];
  const currentIndex = stageOrder.indexOf(currentStage);
  if (currentIndex <= 0) return undefined;

  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevStage = stageOrder[i];
    const stageRemarks = sc.remarks.filter((r) => r.stage === prevStage);
    if (stageRemarks.length > 0) {
      return stageRemarks[stageRemarks.length - 1];
    }
  }
  return undefined;
}

function updateStageHistory(
  stageHistory: StageRecord[],
  stage: ControlStage,
  updates: Partial<StageRecord>
): StageRecord[] {
  return stageHistory.map((record) =>
    record.stage === stage ? { ...record, ...updates } : record
  );
}

export const useSaleControlStore = create<SaleControlStore>()(
  persist(
    (set, get) => ({
      saleControls,
      operationLogs,
      currentSaleControl: null,
      filters: defaultFilters,
      filteredSaleControls: saleControls,
      logFilters: defaultLogFilters,
      filteredLogs: filterLogs(operationLogs, defaultLogFilters),

      createSaleControl: (data) => {
        const { houseId, customerId, remark, lockDuration } = data;
        const currentUser = useUserStore.getState().currentUser;
        const house = useHouseStore.getState().getHouseById(houseId);
        const customer = getCustomerById(customerId);

        if (!house) throw new Error('房源不存在');
        if (!customer) throw new Error('客户不存在');

        const now = new Date().toISOString();

        const newRemark = createRemark(
          remark,
          'application',
          '销控申请',
          currentUser,
          'application'
        );

        const stageHistory: StageRecord[] = [
          createStageRecord('application', currentUser, now, undefined, remark),
        ];

        const newSaleControl: SaleControl = {
          id: `sc_${generateId()}`,
          houseId,
          house,
          customerId,
          customer,
          applicantId: currentUser.id,
          applicant: currentUser,
          currentHandlerId: currentUser.id,
          currentHandler: currentUser,
          status: house.status,
          stage: 'application',
          stageName: STAGE_MAP['application'],
          lockDuration,
          lockExpireAt: undefined,
          remarks: [newRemark],
          currentRemark: remark,
          stageHistory,
          createdAt: now,
          updatedAt: now,
        };

        const log = createOperationLog(
          newSaleControl.id,
          currentUser,
          'create_application',
          house.status,
          house.status,
          undefined,
          'application',
          undefined,
          undefined,
          currentUser.id,
          currentUser.name,
          remark,
          'application',
          false
        );

        set((state) => {
          const newOperationLogs = [...state.operationLogs, log];
          return {
            saleControls: [...state.saleControls, newSaleControl],
            operationLogs: newOperationLogs,
            filteredSaleControls: filterSaleControls(
              [...state.saleControls, newSaleControl],
              state.filters
            ),
            filteredLogs: filterLogs(newOperationLogs, state.logFilters),
          };
        });

        return newSaleControl;
      },

      submitForReview: (id, remark) => {
        const currentUser = useUserStore.getState().currentUser;
        const sc = get().saleControls.find((s) => s.id === id);
        if (!sc) throw new Error('销控记录不存在');
        if (sc.stage !== 'application') throw new Error('当前状态不允许提交审核');

        const beforeStage = sc.stage;
        const afterStage: ControlStage = 'review';
        const now = new Date().toISOString();

        const managers = getManagers();
        const nextHandler = managers[Math.floor(Math.random() * managers.length)];
        const beforeHandler = sc.currentHandler;

        const newRemarks = [...sc.remarks];
        if (remark && remark.trim()) {
          newRemarks.push(
            createRemark(remark, 'application', '销控申请', currentUser, beforeStage)
          );
        }

        const updatedStageHistory = updateStageHistory(
          sc.stageHistory,
          'application',
          { completedAt: now, remark: remark || sc.currentRemark }
        );
        updatedStageHistory.push(createStageRecord('review', nextHandler, now));

        const log = createOperationLog(
          id,
          currentUser,
          'submit_for_review',
          sc.status,
          sc.status,
          beforeStage,
          afterStage,
          beforeHandler.id,
          beforeHandler.name,
          nextHandler.id,
          nextHandler.name,
          remark,
          'application',
          false
        );

        const updatedSaleControl: SaleControl = {
          ...sc,
          stage: afterStage,
          stageName: STAGE_MAP[afterStage],
          previousHandlerId: beforeHandler.id,
          previousHandler: beforeHandler,
          currentHandlerId: nextHandler.id,
          currentHandler: nextHandler,
          remarks: newRemarks,
          currentRemark: remark || sc.currentRemark,
          stageHistory: updatedStageHistory,
          submittedAt: now,
          updatedAt: now,
        };

        set((state) => {
          const newOperationLogs = [...state.operationLogs, log];
          const newSaleControls = state.saleControls.map((s) =>
            s.id === id ? updatedSaleControl : s
          );
          return {
            saleControls: newSaleControls,
            operationLogs: newOperationLogs,
            filteredSaleControls: filterSaleControls(newSaleControls, state.filters),
            filteredLogs: filterLogs(newOperationLogs, state.logFilters),
            currentSaleControl:
              state.currentSaleControl?.id === id
                ? updatedSaleControl
                : state.currentSaleControl,
          };
        });
      },

      reviewApprove: (id, remark) => {
        const currentUser = useUserStore.getState().currentUser;
        const sc = get().saleControls.find((s) => s.id === id);
        if (!sc) throw new Error('销控记录不存在');
        if (sc.stage !== 'review') throw new Error('当前状态不允许审核');

        const beforeStage = sc.stage;
        const afterStage: ControlStage = 'lock';
        const now = new Date().toISOString();

        const controllers = getControllers();
        const nextHandler = controllers[Math.floor(Math.random() * controllers.length)];
        const beforeHandler = sc.currentHandler;

        const previousRemark = getPreviousStageRemarks(sc, afterStage);
        const inheritedRemark = remark && remark.trim() ? remark : previousRemark?.content || '';
        const isInherited = !(remark && remark.trim()) && !!previousRemark?.content;

        const newRemarks = [...sc.remarks];
        newRemarks.push(
          createRemark(
            inheritedRemark,
            'review',
            '经理审核',
            currentUser,
            afterStage,
            isInherited ? previousRemark?.id : undefined
          )
        );

        const updatedStageHistory = updateStageHistory(
          sc.stageHistory,
          'review',
          { completedAt: now, remark: inheritedRemark }
        );
        updatedStageHistory.push(createStageRecord('lock', nextHandler, now));

        const log = createOperationLog(
          id,
          currentUser,
          'review_approve',
          sc.status,
          sc.status,
          beforeStage,
          afterStage,
          beforeHandler.id,
          beforeHandler.name,
          nextHandler.id,
          nextHandler.name,
          inheritedRemark,
          'review',
          isInherited
        );

        const updatedSaleControl: SaleControl = {
          ...sc,
          stage: afterStage,
          stageName: STAGE_MAP[afterStage],
          previousHandlerId: beforeHandler.id,
          previousHandler: beforeHandler,
          currentHandlerId: nextHandler.id,
          currentHandler: nextHandler,
          remarks: newRemarks,
          currentRemark: inheritedRemark,
          stageHistory: updatedStageHistory,
          reviewedAt: now,
          updatedAt: now,
        };

        set((state) => {
          const newOperationLogs = [...state.operationLogs, log];
          const newSaleControls = state.saleControls.map((s) =>
            s.id === id ? updatedSaleControl : s
          );
          return {
            saleControls: newSaleControls,
            operationLogs: newOperationLogs,
            filteredSaleControls: filterSaleControls(newSaleControls, state.filters),
            filteredLogs: filterLogs(newOperationLogs, state.logFilters),
            currentSaleControl:
              state.currentSaleControl?.id === id
                ? updatedSaleControl
                : state.currentSaleControl,
          };
        });
      },

      reviewReject: (id, remark) => {
        const currentUser = useUserStore.getState().currentUser;
        const sc = get().saleControls.find((s) => s.id === id);
        if (!sc) throw new Error('销控记录不存在');
        if (sc.stage !== 'review') throw new Error('当前状态不允许审核');
        if (!remark || remark.trim() === '') {
          throw new Error('驳回原因不能为空');
        }

        const beforeStage = sc.stage;
        const afterStage: ControlStage = 'rejected';
        const now = new Date().toISOString();
        const beforeHandler = sc.currentHandler;

        const newRemarks = [...sc.remarks];
        newRemarks.push(
          createRemark(remark, 'review', '经理审核', currentUser, afterStage)
        );

        const updatedStageHistory = updateStageHistory(
          sc.stageHistory,
          'review',
          { completedAt: now, remark }
        );
        updatedStageHistory.push(createStageRecord('rejected', currentUser, now, now, remark));

        const log = createOperationLog(
          id,
          currentUser,
          'review_reject',
          sc.status,
          sc.status,
          beforeStage,
          afterStage,
          beforeHandler.id,
          beforeHandler.name,
          currentUser.id,
          currentUser.name,
          remark,
          'review',
          false
        );

        const updatedHouse = { ...sc.house, status: 'available' as HouseStatus };
        useHouseStore.getState().updateHouseStatus(sc.houseId, 'available');

        const updatedSaleControl: SaleControl = {
          ...sc,
          house: updatedHouse,
          stage: afterStage,
          stageName: STAGE_MAP[afterStage],
          previousHandlerId: beforeHandler.id,
          previousHandler: beforeHandler,
          currentHandlerId: currentUser.id,
          currentHandler: currentUser,
          remarks: newRemarks,
          currentRemark: remark,
          stageHistory: updatedStageHistory,
          rejectedAt: now,
          updatedAt: now,
        };

        set((state) => {
          const newOperationLogs = [...state.operationLogs, log];
          const newSaleControls = state.saleControls.map((s) =>
            s.id === id ? updatedSaleControl : s
          );
          return {
            saleControls: newSaleControls,
            operationLogs: newOperationLogs,
            filteredSaleControls: filterSaleControls(newSaleControls, state.filters),
            filteredLogs: filterLogs(newOperationLogs, state.logFilters),
            currentSaleControl:
              state.currentSaleControl?.id === id
                ? updatedSaleControl
                : state.currentSaleControl,
          };
        });
      },

      lockHouse: (id, duration, remark) => {
        const currentUser = useUserStore.getState().currentUser;
        const sc = get().saleControls.find((s) => s.id === id);
        if (!sc) throw new Error('销控记录不存在');
        if (sc.stage !== 'lock') throw new Error('当前状态不允许锁定');

        const beforeStatus = sc.status;
        const afterStatus: HouseStatus = 'locked';
        const beforeStage = sc.stage;
        const afterStage: ControlStage = 'lock';
        const now = new Date().toISOString();

        const lockExpireAt = new Date(
          new Date().getTime() + duration * 60 * 60 * 1000
        ).toISOString();

        const previousRemark = getPreviousStageRemarks(sc, afterStage);
        let finalRemark: string;
        let isInherited = false;

        if (remark && remark.trim()) {
          finalRemark = `房源已锁定，锁定时长${duration}小时。${remark}`;
        } else if (previousRemark?.content) {
          finalRemark = `房源已锁定，锁定时长${duration}小时。（备注自动从审核环节带入：${previousRemark.content}）`;
          isInherited = true;
        } else {
          finalRemark = `房源已锁定，锁定时长${duration}小时。`;
        }

        const newRemarks = [...sc.remarks];
        newRemarks.push(
          createRemark(
            finalRemark,
            'lock',
            '执行锁定',
            currentUser,
            afterStage,
            isInherited ? previousRemark?.id : undefined
          )
        );

        const updatedStageHistory = updateStageHistory(
          sc.stageHistory,
          'lock',
          { completedAt: now, remark: finalRemark }
        );

        const log = createOperationLog(
          id,
          currentUser,
          'lock_house',
          beforeStatus,
          afterStatus,
          beforeStage,
          afterStage,
          sc.currentHandlerId,
          sc.currentHandler.name,
          currentUser.id,
          currentUser.name,
          finalRemark,
          'lock',
          isInherited
        );

        const updatedHouse = { ...sc.house, status: afterStatus };
        useHouseStore.getState().updateHouseStatus(sc.houseId, afterStatus);

        const updatedSaleControl: SaleControl = {
          ...sc,
          house: updatedHouse,
          status: afterStatus,
          stage: afterStage,
          stageName: STAGE_MAP[afterStage],
          lockDuration: duration,
          lockExpireAt,
          remarks: newRemarks,
          currentRemark: finalRemark,
          stageHistory: updatedStageHistory,
          lockedAt: now,
          updatedAt: now,
        };

        set((state) => {
          const newOperationLogs = [...state.operationLogs, log];
          const newSaleControls = state.saleControls.map((s) =>
            s.id === id ? updatedSaleControl : s
          );
          return {
            saleControls: newSaleControls,
            operationLogs: newOperationLogs,
            filteredSaleControls: filterSaleControls(newSaleControls, state.filters),
            filteredLogs: filterLogs(newOperationLogs, state.logFilters),
            currentSaleControl:
              state.currentSaleControl?.id === id
                ? updatedSaleControl
                : state.currentSaleControl,
          };
        });
      },

      completeSale: (id, remark) => {
        const currentUser = useUserStore.getState().currentUser;
        const sc = get().saleControls.find((s) => s.id === id);
        if (!sc) throw new Error('销控记录不存在');
        if (sc.stage !== 'lock') throw new Error('当前状态不允许完成销售');

        const beforeStatus = sc.status;
        const afterStatus: HouseStatus = 'sold';
        const beforeStage = sc.stage;
        const afterStage: ControlStage = 'completed';
        const now = new Date().toISOString();

        const previousRemark = getPreviousStageRemarks(sc, afterStage);
        const autoRemark = remark && remark.trim() ? remark : (previousRemark?.content ? `交易完成。${previousRemark.content}` : '客户已按时签约，交易完成。');

        const newRemarks = [...sc.remarks];
        newRemarks.push(
          createRemark(autoRemark, 'complete', '完成销售', currentUser, afterStage)
        );

        const updatedStageHistory = updateStageHistory(
          sc.stageHistory,
          'lock',
          { completedAt: now }
        );
        updatedStageHistory.push(createStageRecord('completed', currentUser, now, now, autoRemark));

        const log = createOperationLog(
          id,
          currentUser,
          'complete_sale',
          beforeStatus,
          afterStatus,
          beforeStage,
          afterStage,
          sc.currentHandlerId,
          sc.currentHandler.name,
          currentUser.id,
          currentUser.name,
          autoRemark,
          'complete',
          false
        );

        const updatedHouse = { ...sc.house, status: afterStatus };
        useHouseStore.getState().updateHouseStatus(sc.houseId, afterStatus);

        const updatedSaleControl: SaleControl = {
          ...sc,
          house: updatedHouse,
          status: afterStatus,
          stage: afterStage,
          stageName: STAGE_MAP[afterStage],
          remarks: newRemarks,
          currentRemark: autoRemark,
          stageHistory: updatedStageHistory,
          completedAt: now,
          updatedAt: now,
        };

        set((state) => {
          const newOperationLogs = [...state.operationLogs, log];
          const newSaleControls = state.saleControls.map((s) =>
            s.id === id ? updatedSaleControl : s
          );
          return {
            saleControls: newSaleControls,
            operationLogs: newOperationLogs,
            filteredSaleControls: filterSaleControls(newSaleControls, state.filters),
            filteredLogs: filterLogs(newOperationLogs, state.logFilters),
            currentSaleControl:
              state.currentSaleControl?.id === id
                ? updatedSaleControl
                : state.currentSaleControl,
          };
        });
      },

      updateRemark: (id, remark, source = 'application') => {
        const currentUser = useUserStore.getState().currentUser;
        const sc = get().saleControls.find((s) => s.id === id);
        if (!sc) throw new Error('销控记录不存在');
        if (!remark || remark.trim() === '') return;

        const now = new Date().toISOString();
        const sourceNameMap: Record<string, string> = {
          application: '销控申请',
          review: '经理审核',
          lock: '执行锁定',
          complete: '完成销售',
        };

        const newRemark = createRemark(
          remark,
          source,
          sourceNameMap[source] || source,
          currentUser,
          sc.stage
        );

        const log = createOperationLog(
          id,
          currentUser,
          'update_remark',
          sc.status,
          sc.status,
          sc.stage,
          sc.stage,
          sc.currentHandlerId,
          sc.currentHandler.name,
          sc.currentHandlerId,
          sc.currentHandler.name,
          remark,
          source,
          false
        );

        const updatedSaleControl: SaleControl = {
          ...sc,
          remarks: [...sc.remarks, newRemark],
          currentRemark: remark,
          updatedAt: now,
        };

        set((state) => {
          const newOperationLogs = [...state.operationLogs, log];
          const newSaleControls = state.saleControls.map((s) =>
            s.id === id ? updatedSaleControl : s
          );
          return {
            saleControls: newSaleControls,
            operationLogs: newOperationLogs,
            filteredSaleControls: filterSaleControls(newSaleControls, state.filters),
            filteredLogs: filterLogs(newOperationLogs, state.logFilters),
            currentSaleControl:
              state.currentSaleControl?.id === id
                ? updatedSaleControl
                : state.currentSaleControl,
          };
        });
      },

      getSaleControlLogs: (id) => {
        return get()
          .operationLogs.filter((log) => log.saleControlId === id)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      },

      getPreviousRemark: (id, currentStage) => {
        const sc = get().saleControls.find((s) => s.id === id);
        if (!sc) return undefined;
        return getPreviousStageRemarks(sc, currentStage);
      },

      getStageRecord: (id, stage) => {
        const sc = get().saleControls.find((s) => s.id === id);
        if (!sc) return undefined;
        return sc.stageHistory.find((r) => r.stage === stage);
      },

      setFilters: (newFilters) => {
        const updatedFilters = { ...get().filters, ...newFilters };
        const filtered = filterSaleControls(get().saleControls, updatedFilters);
        set({ filters: updatedFilters, filteredSaleControls: filtered });
      },

      setLogFilters: (newFilters) => {
        const updatedFilters = { ...get().logFilters, ...newFilters };
        const filtered = filterLogs(get().operationLogs, updatedFilters);
        set({ logFilters: updatedFilters, filteredLogs: filtered });
      },

      setCurrentSaleControl: (saleControl) => set({ currentSaleControl: saleControl }),

      getSaleControlById: (id) => get().saleControls.find((s) => s.id === id),
    }),
    {
      name: 'sale-control-store',
    }
  )
);
