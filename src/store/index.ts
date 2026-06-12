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
  getCattleById: (id: number) => Cattle | undefined;
  getVeterinaryById: (id: number) => VeterinaryRecord | undefined;
  getQuarantineById: (id: number) => QuarantineRecord | undefined;
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
    set((state) => ({
      veterinaryRecords: state.veterinaryRecords.map((record) =>
        record.id === id
          ? { ...record, status, rejectReason, updatedAt: new Date().toISOString() }
          : record
      ),
    }));
  },

  updateQuarantineStatus: (id, status, rejectReason) => {
    set((state) => ({
      quarantineRecords: state.quarantineRecords.map((record) =>
        record.id === id
          ? { ...record, status, rejectReason, updatedAt: new Date().toISOString() }
          : record
      ),
    }));
  },

  addExceptionRecord: (record) => {
    set((state) => ({
      exceptionRecords: [
        { ...record, id: state.exceptionRecords.length + 1 },
        ...state.exceptionRecords,
      ],
    }));
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
