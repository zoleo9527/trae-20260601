import { create } from 'zustand';
import { Cattle, VeterinaryRecord, QuarantineRecord, ExceptionRecord, MilkingRecord, FeedingPlan, FilterOptions } from '@/types';
import { cattleData, veterinaryData, quarantineData, exceptionData, milkingData, feedingData } from '@/data/mockData';

interface RecentChangeRecord {
  id: number;
  type: 'veterinary' | 'quarantine' | 'exception';
  status?: string;
  cattleId?: number;
  vetRecordId?: number;
  quarantineId?: number;
  symptoms?: string;
  diagnosis?: string;
  reason?: string;
  description?: string;
  vetName?: string;
  operator?: string;
  createdAt: string;
  updatedAt?: string;
}

interface FarmStore {
  cattle: Cattle[];
  veterinaryRecords: VeterinaryRecord[];
  quarantineRecords: QuarantineRecord[];
  exceptionRecords: ExceptionRecord[];
  milkingRecords: MilkingRecord[];
  feedingPlans: FeedingPlan[];
  filterOptions: FilterOptions;

  setFilterOptions: (options: Partial<FilterOptions>) => void;
  updateVeterinaryStatus: (id: number, status: VeterinaryRecord['status'], rejectReason?: string) => void;
  updateQuarantineStatus: (id: number, status: QuarantineRecord['status'], rejectReason?: string) => void;
  addExceptionRecord: (record: Omit<ExceptionRecord, 'id'>) => void;
  createQuarantine: (vetRecordId: number, cattleId: number, reason: string, operator: string) => number;
  updateQuarantine: (id: number, updates: Partial<QuarantineRecord>) => void;
  supplementVeterinary: (id: number, updates: Partial<VeterinaryRecord>) => void;
  getCattleById: (id: number) => Cattle | undefined;
  getVeterinaryById: (id: number) => VeterinaryRecord | undefined;
  getQuarantineById: (id: number) => QuarantineRecord | undefined;
  getQuarantineByVetRecordId: (vetRecordId: number) => QuarantineRecord | undefined;
  getPendingVeterinary: () => VeterinaryRecord[];
  getPendingQuarantine: () => QuarantineRecord[];
  getRejectedRecords: () => (VeterinaryRecord | QuarantineRecord)[];
  getRecentChanges: () => RecentChangeRecord[];
}

export const useFarmStore = create<FarmStore>((set, get) => ({
  cattle: cattleData,
  veterinaryRecords: veterinaryData,
  quarantineRecords: quarantineData,
  exceptionRecords: exceptionData,
  milkingRecords: milkingData,
  feedingPlans: feedingData,
  filterOptions: {
    keyword: '',
    status: 'all',
    dateRange: null,
    cattleId: null,
  },

  setFilterOptions: (options) => {
    set((state) => ({
      filterOptions: { ...state.filterOptions, ...options },
    }));
  },

  updateVeterinaryStatus: (id, status, rejectReason) => {
    const now = new Date().toISOString();
    set((state) => ({
      veterinaryRecords: state.veterinaryRecords.map((record) =>
        record.id === id
          ? { ...record, status, rejectReason, updatedAt: now }
          : record
      ),
    }));

    if (status === 'rejected' && rejectReason) {
      get().addExceptionRecord({
        vetRecordId: id,
        type: 'reject',
        description: rejectReason,
        action: '巡诊单被驳回',
        createdAt: now,
        operator: '系统',
      });
    }
  },

  updateQuarantineStatus: (id, status, rejectReason) => {
    const now = new Date().toISOString();
    const quarantineRecord = get().getQuarantineById(id);
    
    set((state) => ({
      quarantineRecords: state.quarantineRecords.map((record) =>
        record.id === id
          ? { ...record, status, rejectReason, updatedAt: now }
          : record
      ),
    }));

    if (status === 'rejected' && rejectReason) {
      get().addExceptionRecord({
        quarantineId: id,
        type: 'reject',
        description: rejectReason,
        action: '隔离申请被驳回',
        createdAt: now,
        operator: '系统',
      });
    } else if (status === 'quarantining') {
      get().addExceptionRecord({
        quarantineId: id,
        vetRecordId: quarantineRecord?.vetRecordId,
        type: 'info',
        description: `隔离申请 #${id} 已批准`,
        action: '开始隔离观察',
        createdAt: now,
        operator: '系统',
      });
    } else if (status === 'completed') {
      get().addExceptionRecord({
        quarantineId: id,
        vetRecordId: quarantineRecord?.vetRecordId,
        type: 'info',
        description: `隔离申请 #${id} 已解除隔离`,
        action: '解除隔离，恢复正常饲养',
        createdAt: now,
        operator: '系统',
      });
    }
  },

  addExceptionRecord: (record) => {
    set((state) => ({
      exceptionRecords: [
        { ...record, id: state.exceptionRecords.length + 1 },
        ...state.exceptionRecords,
      ],
    }));
  },

  createQuarantine: (vetRecordId, cattleId, reason, operator) => {
    const now = new Date().toISOString();
    
    const existingQuarantine = get().quarantineRecords.find(q => q.vetRecordId === vetRecordId);
    
    if (existingQuarantine) {
      get().updateQuarantine(existingQuarantine.id, {
        reason,
        status: 'pending',
        rejectReason: undefined,
      });
      
      get().addExceptionRecord({
        vetRecordId,
        quarantineId: existingQuarantine.id,
        type: 'info',
        description: `巡诊单 #${vetRecordId} 补录后更新隔离申请 #${existingQuarantine.id}`,
        action: `更新隔离原因: ${reason}`,
        createdAt: now,
        operator,
      });
      
      get().updateVeterinaryStatus(vetRecordId, 'processing');
      return existingQuarantine.id;
    }
    
    const newId = get().quarantineRecords.length + 1;
    
    set((state) => ({
      quarantineRecords: [
        {
          id: newId,
          vetRecordId,
          cattleId,
          startDate: now.split('T')[0],
          reason,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          operator,
        },
        ...state.quarantineRecords,
      ],
    }));

    get().addExceptionRecord({
      vetRecordId,
      type: 'info',
      description: `巡诊单 #${vetRecordId} 已转隔离申请 #${newId}`,
      action: `创建隔离单，原因: ${reason}`,
      createdAt: now,
      operator,
    });

    get().updateVeterinaryStatus(vetRecordId, 'processing');
    return newId;
  },

  updateQuarantine: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => ({
      quarantineRecords: state.quarantineRecords.map((record) =>
        record.id === id
          ? { ...record, ...updates, updatedAt: now }
          : record
      ),
    }));
  },

  supplementVeterinary: (id, updates) => {
    const now = new Date().toISOString();
    const originalRecord = get().getVeterinaryById(id);
    const existingQuarantine = get().quarantineRecords.find(q => q.vetRecordId === id);
    
    set((state) => ({
      veterinaryRecords: state.veterinaryRecords.map((record) =>
        record.id === id
          ? { ...record, ...updates, status: 'pending', rejectReason: undefined, updatedAt: now }
          : record
      ),
    }));

    if (existingQuarantine) {
      get().updateQuarantine(existingQuarantine.id, {
        reason: updates.diagnosis || existingQuarantine.reason,
        status: 'pending',
        rejectReason: undefined,
      });
      
      get().addExceptionRecord({
        vetRecordId: id,
        quarantineId: existingQuarantine.id,
        type: 'info',
        description: `巡诊单 #${id} 补录后更新关联隔离申请 #${existingQuarantine.id}`,
        action: `同步更新隔离原因: ${updates.diagnosis || '未变更诊断'}`,
        createdAt: now,
        operator: '系统',
      });
    }

    const updateSummary = Object.keys(updates).map(key => {
      const value = updates[key as keyof typeof updates];
      if (value !== undefined && value !== originalRecord?.[key as keyof VeterinaryRecord]) {
        return key === 'symptoms' ? '症状描述' :
               key === 'diagnosis' ? '诊断结果' :
               key === 'treatment' ? '处理方案' :
               key === 'vetName' ? '兽医' :
               key === 'examDate' ? '巡诊日期' : key;
      }
      return null;
    }).filter(Boolean).join('、');

    get().addExceptionRecord({
      vetRecordId: id,
      type: 'info',
      description: `巡诊单 #${id} 已补录更新`,
      action: `更新内容: ${updateSummary || '未知'}`,
      createdAt: now,
      operator: '系统',
    });
  },

  getCattleById: (id) => {
    return get().cattle.find((c) => c.id === id);
  },

  getVeterinaryById: (id) => {
    return get().veterinaryRecords.find((r) => r.id === id);
  },

  getQuarantineById: (id) => {
    return get().quarantineRecords.find((r) => r.id === id);
  },

  getQuarantineByVetRecordId: (vetRecordId) => {
    return get().quarantineRecords.find((r) => r.vetRecordId === vetRecordId);
  },

  getPendingVeterinary: () => {
    return get().veterinaryRecords.filter((r) => r.status === 'pending');
  },

  getPendingQuarantine: () => {
    return get().quarantineRecords.filter((r) => r.status === 'pending');
  },

  getRejectedRecords: () => {
    const { veterinaryRecords, quarantineRecords } = get();
    const rejectedVet = veterinaryRecords.filter((r) => r.status === 'rejected');
    const rejectedQuar = quarantineRecords.filter((r) => r.status === 'rejected');
    return [...rejectedVet, ...rejectedQuar];
  },

  getRecentChanges: () => {
    const { veterinaryRecords, quarantineRecords, exceptionRecords } = get();
    const allRecords: RecentChangeRecord[] = [
      ...veterinaryRecords.map((r) => ({ ...r, type: 'veterinary' as const })),
      ...quarantineRecords.map((r) => ({ ...r, type: 'quarantine' as const })),
      ...exceptionRecords.map((r) => ({ ...r, type: 'exception' as const })),
    ];
    return allRecords.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).slice(0, 10);
  },
}));
