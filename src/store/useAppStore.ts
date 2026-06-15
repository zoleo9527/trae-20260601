import { create } from 'zustand';
import {
  AppState,
  Role,
  Anomaly,
  AnomalyStatus,
  FilterOptions,
  TimelineLog,
} from '@/types';
import { mockEquipments } from '@/data/mockEquipments';
import { mockCustomers } from '@/data/mockCustomers';
import { mockReservations } from '@/data/mockReservations';
import { mockContracts } from '@/data/mockContracts';
import { mockRepairs } from '@/data/mockRepairs';
import { mockAnomalies } from '@/data/mockAnomalies';
import { mockTimeline } from '@/data/mockTimeline';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  exportData,
  importData,
  downloadBackup,
  readFileAsText,
} from '@/utils/backupUtils';
import { filterAnomalies, sortAnomaliesByStuckTime } from '@/utils/filterUtils';
import { generateId, getToday } from '@/utils/dateUtils';

const getInitialState = (): AppState => {
  const saved = loadFromLocalStorage();
  if (saved) {
    return saved;
  }
  return {
    currentRole: 'manager',
    reservations: mockReservations,
    contracts: mockContracts,
    repairs: mockRepairs,
    anomalies: mockAnomalies,
    equipments: mockEquipments,
    customers: mockCustomers,
    timelineLogs: mockTimeline,
  };
};

interface AppStore extends AppState {
  setCurrentRole: (role: Role) => void;
  updateAnomalyStatus: (id: string, status: AnomalyStatus, comment: string) => void;
  filterAnomalies: (filters: FilterOptions) => Anomaly[];
  getAnomalyById: (id: string) => Anomaly | undefined;
  getReservationById: (id: string) => typeof mockReservations[0] | undefined;
  getContractById: (id: string) => typeof mockContracts[0] | undefined;
  getRepairById: (id: string) => typeof mockRepairs[0] | undefined;
  getEquipmentById: (id: string) => typeof mockEquipments[0] | undefined;
  getCustomerById: (id: string) => typeof mockCustomers[0] | undefined;
  getTimelineBySource: (
    sourceType: 'reservation' | 'contract' | 'repair',
    sourceId: string
  ) => TimelineLog[];
  verifyMaterials: (id: string, verified: boolean, missing: string[], remark: string) => void;
  dispatchReservation: (id: string, remark: string) => void;
  confirmDelivery: (id: string, remark: string) => void;
  updateFuel: (id: string, returnFuel: number, hasDispute: boolean, reason: string, remark: string) => void;
  confirmReturn: (id: string, remark: string) => void;
  updateRepair: (id: string, content: string, parts: string[], cost: number, remark: string) => void;
  setLiability: (id: string, liability: 'customer' | 'owner' | 'natural', remark: string) => void;
  reviewRepair: (id: string, approved: boolean, comment: string, remark: string) => void;
  addTimelineLog: (log: Omit<TimelineLog, 'id' | 'timestamp'>) => void;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<boolean>;
  resetData: () => void;
  getOperatorName: () => string;
}

const ROLE_OPERATORS: Record<Role, string> = {
  manager: '租赁经理孙总',
  dispatcher: '调度员小李',
  repairer: '维修师傅刘师傅',
};

export const useAppStore = create<AppStore>((set, get) => {
  const persist = () => {
    const state = get();
    const { currentRole, ...data } = state;
    saveToLocalStorage(state);
  };

  const addTimelineLog = (log: Omit<TimelineLog, 'id' | 'timestamp'>) => {
    const newLog: TimelineLog = {
      ...log,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      timelineLogs: [...state.timelineLogs, newLog],
    }));
    persist();
  };

  return {
    ...getInitialState(),

    setCurrentRole: (role: Role) => {
      set({ currentRole: role });
      persist();
    },

    updateAnomalyStatus: (id: string, status: AnomalyStatus, comment: string) => {
      const state = get();
      const anomaly = state.anomalies.find((a) => a.id === id);
      if (!anomaly) return;

      set((state) => ({
        anomalies: state.anomalies.map((a) =>
          a.id === id ? { ...a, status, comments: comment } : a
        ),
      }));

      addTimelineLog({
        sourceType: anomaly.sourceType,
        sourceId: anomaly.sourceId,
        action: `异常${status === 'processing' ? '开始处理' : status === 'resolved' ? '已解决' : '更新'}`,
        operator: ROLE_OPERATORS[state.currentRole],
        role: state.currentRole,
        remark: comment,
      });

      persist();
    },

    filterAnomalies: (filters: FilterOptions) => {
      const state = get();
      const filtered = filterAnomalies(state.anomalies, filters);
      return sortAnomaliesByStuckTime(filtered);
    },

    getAnomalyById: (id: string) => get().anomalies.find((a) => a.id === id),
    getReservationById: (id: string) => get().reservations.find((r) => r.id === id),
    getContractById: (id: string) => get().contracts.find((c) => c.id === id),
    getRepairById: (id: string) => get().repairs.find((r) => r.id === id),
    getEquipmentById: (id: string) => get().equipments.find((e) => e.id === id),
    getCustomerById: (id: string) => get().customers.find((c) => c.id === id),

    getTimelineBySource: (sourceType, sourceId) => {
      return get()
        .timelineLogs.filter(
          (log) => log.sourceType === sourceType && log.sourceId === sourceId
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    },

    verifyMaterials: (id: string, verified: boolean, missing: string[], remark: string) => {
      const state = get();
      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.id === id
            ? {
                ...r,
                materialVerified: verified,
                missingMaterials: missing,
                status: verified ? 'material_verified' : 'pending',
              }
            : r
        ),
      }));

      addTimelineLog({
        sourceType: 'reservation',
        sourceId: id,
        action: verified ? '材料核验通过' : '材料核验不通过',
        operator: ROLE_OPERATORS[state.currentRole],
        role: state.currentRole,
        remark: verified ? '材料齐全' : `缺少: ${missing.join(', ')}`,
      });

      if (!verified && missing.length > 0) {
        const newAnomaly: Anomaly = {
          id: generateId(),
          sourceType: 'reservation',
          sourceId: id,
          type: 'material_missing',
          description: `预约单材料核验不通过，缺少: ${missing.join(', ')}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          currentHandler: 'dispatcher',
          stuckHours: 0,
          comments: remark,
        };
        set((state) => ({
          anomalies: [...state.anomalies, newAnomaly],
        }));
      }

      persist();
    },

    dispatchReservation: (id: string, remark: string) => {
      const state = get();
      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.id === id ? { ...r, status: 'dispatched' } : r
        ),
      }));

      addTimelineLog({
        sourceType: 'reservation',
        sourceId: id,
        action: '调度派车',
        operator: ROLE_OPERATORS[state.currentRole],
        role: state.currentRole,
        remark,
      });

      persist();
    },

    confirmDelivery: (id: string, remark: string) => {
      const state = get();
      const reservation = state.reservations.find((r) => r.id === id);
      if (!reservation) return;

      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.id === id ? { ...r, status: 'delivered' } : r
        ),
      }));

      const contractNo = `HT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      const newContract = {
        id: generateId(),
        reservationId: id,
        contractNo,
        actualStartDate: getToday(),
        actualEndDate: null,
        initialFuel: 80,
        returnFuel: null,
        totalAmount: null,
        status: 'active' as const,
        fuelDispute: false,
        fuelDisputeReason: '',
        overdueDays: 0,
        overdueFee: 0,
      };

      set((state) => ({
        contracts: [...state.contracts, newContract],
      }));

      addTimelineLog({
        sourceType: 'reservation',
        sourceId: id,
        action: '确认交付',
        operator: ROLE_OPERATORS[state.currentRole],
        role: state.currentRole,
        remark,
      });

      addTimelineLog({
        sourceType: 'contract',
        sourceId: newContract.id,
        action: '生成租期合同',
        operator: '系统',
        role: 'manager',
        remark: `合同号${contractNo}已生成`,
      });

      persist();
    },

    updateFuel: (id: string, returnFuel: number, hasDispute: boolean, reason: string, remark: string) => {
      const state = get();
      const contract = state.contracts.find((c) => c.id === id);
      if (!contract) return;

      set((state) => ({
        contracts: state.contracts.map((c) =>
          c.id === id
            ? {
                ...c,
                returnFuel,
                fuelDispute: hasDispute,
                fuelDisputeReason: reason,
                status: hasDispute ? 'fuel_verified' : 'completed',
              }
            : c
        ),
      }));

      addTimelineLog({
        sourceType: 'contract',
        sourceId: id,
        action: hasDispute ? '油耗争议标记' : '油耗核算完成',
        operator: ROLE_OPERATORS[state.currentRole],
        role: state.currentRole,
        remark: hasDispute ? reason : remark,
      });

      if (hasDispute) {
        const newAnomaly: Anomaly = {
          id: generateId(),
          sourceType: 'contract',
          sourceId: id,
          type: 'fuel_dispute',
          description: `合同${contract.contractNo}油耗争议：${reason}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          currentHandler: 'manager',
          stuckHours: 0,
          comments: remark,
        };
        set((state) => ({
          anomalies: [...state.anomalies, newAnomaly],
        }));
      }

      persist();
    },

    confirmReturn: (id: string, remark: string) => {
      const state = get();
      set((state) => ({
        contracts: state.contracts.map((c) =>
          c.id === id
            ? { ...c, actualEndDate: getToday(), status: 'returned' }
            : c
        ),
      }));

      addTimelineLog({
        sourceType: 'contract',
        sourceId: id,
        action: '设备归还',
        operator: ROLE_OPERATORS[state.currentRole],
        role: state.currentRole,
        remark,
      });

      persist();
    },

    updateRepair: (id: string, content: string, parts: string[], cost: number, remark: string) => {
      const state = get();
      set((state) => ({
        repairs: state.repairs.map((r) =>
          r.id === id
            ? {
                ...r,
                repairContent: content,
                partsReplaced: parts,
                repairCost: cost,
              }
            : r
        ),
      }));

      addTimelineLog({
        sourceType: 'repair',
        sourceId: id,
        action: '维修处理完成',
        operator: ROLE_OPERATORS[state.currentRole],
        role: state.currentRole,
        remark,
      });

      persist();
    },

    setLiability: (id: string, liability: 'customer' | 'owner' | 'natural', remark: string) => {
      const state = get();
      const repair = state.repairs.find((r) => r.id === id);
      if (!repair) return;

      set((state) => ({
        repairs: state.repairs.map((r) =>
          r.id === id
            ? {
                ...r,
                liability,
                reviewStatus: 'pending',
              }
            : r
        ),
      }));

      addTimelineLog({
        sourceType: 'repair',
        sourceId: id,
        action: '提交责任认定',
        operator: ROLE_OPERATORS[state.currentRole],
        role: state.currentRole,
        remark: `认定为: ${liability === 'customer' ? '客户责任' : liability === 'owner' ? '租赁方责任' : '自然损耗'}`,
      });

      persist();
    },

    reviewRepair: (id: string, approved: boolean, comment: string, remark: string) => {
      const state = get();
      const repair = state.repairs.find((r) => r.id === id);
      if (!repair) return;

      set((state) => ({
        repairs: state.repairs.map((r) =>
          r.id === id
            ? {
                ...r,
                reviewStatus: approved ? 'approved' : 'rejected',
                reviewComment: comment,
              }
            : r
        ),
      }));

      addTimelineLog({
        sourceType: 'repair',
        sourceId: id,
        action: approved ? '复核通过' : '复核不通过',
        operator: ROLE_OPERATORS[state.currentRole],
        role: state.currentRole,
        remark: comment,
      });

      if (!approved) {
        const newAnomaly: Anomaly = {
          id: generateId(),
          sourceType: 'repair',
          sourceId: id,
          type: 'review_failed',
          description: `维修单${repair.repairNo}复核不通过：${comment}`,
          status: 'pending',
          createdAt: new Date().toISOString(),
          currentHandler: 'repairer',
          stuckHours: 0,
          comments: remark,
        };
        set((state) => ({
          anomalies: [...state.anomalies, newAnomaly],
        }));
      }

      persist();
    },

    addTimelineLog,

    exportBackup: () => {
      const state = get();
      const data = exportData(state);
      downloadBackup(data);
    },

    importBackup: async (file: File) => {
      try {
        const text = await readFileAsText(file);
        const data = importData(text);
        if (data) {
          set(data);
          persist();
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },

    resetData: () => {
      localStorage.removeItem('rental-app-state');
      set(getInitialState());
    },

    getOperatorName: () => ROLE_OPERATORS[get().currentRole],
  };
});
