import { create } from 'zustand';
import { 
  RescueCase, 
  FosterRecord, 
  MedicalRecord, 
  AdoptionRecord, 
  ReviewLog, 
  TimelineEvent,
  FilterOptions,
  SupplyUsage
} from '@/types';
import { 
  mockCases, 
  mockFosterRecords, 
  mockMedicalRecords, 
  mockAdoptionRecords, 
  mockReviewLogs, 
  mockTimelineEvents 
} from '@/mock/cases';
import { mockSupplyUsages } from '@/mock/supplies';

interface CaseState {
  cases: RescueCase[];
  fosterRecords: FosterRecord[];
  medicalRecords: MedicalRecord[];
  adoptionRecords: AdoptionRecord[];
  reviewLogs: ReviewLog[];
  timelineEvents: TimelineEvent[];
  supplyUsages: SupplyUsage[];
  currentCaseId: string | null;
  filters: FilterOptions;
  setCurrentCaseId: (id: string | null) => void;
  setFilters: (filters: FilterOptions) => void;
  getCaseById: (id: string) => RescueCase | undefined;
  getFosterRecordsByCaseId: (caseId: string) => FosterRecord[];
  getMedicalRecordsByCaseId: (caseId: string) => MedicalRecord[];
  getAdoptionRecordByCaseId: (caseId: string) => AdoptionRecord | undefined;
  getReviewLogsByCaseId: (caseId: string) => ReviewLog[];
  getTimelineEventsByCaseId: (caseId: string) => TimelineEvent[];
  getSupplyUsagesByCaseId: (caseId: string) => SupplyUsage[];
  addFosterRecord: (record: FosterRecord) => void;
  addSupplyUsage: (usage: SupplyUsage) => void;
  addMedicalRecord: (record: MedicalRecord) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  updateCaseStatus: (caseId: string, status: RescueCase['status']) => void;
  addReviewLog: (log: ReviewLog) => void;
  getFilteredCases: () => RescueCase[];
}

export const useCaseStore = create<CaseState>((set, get) => ({
  cases: mockCases,
  fosterRecords: mockFosterRecords,
  medicalRecords: mockMedicalRecords,
  adoptionRecords: mockAdoptionRecords,
  reviewLogs: mockReviewLogs,
  timelineEvents: mockTimelineEvents,
  supplyUsages: mockSupplyUsages,
  currentCaseId: null,
  filters: {},

  setCurrentCaseId: (id) => set({ currentCaseId: id }),
  
  setFilters: (filters) => set({ filters }),

  getCaseById: (id) => get().cases.find(c => c.id === id),

  getFosterRecordsByCaseId: (caseId) => 
    get().fosterRecords.filter(fr => fr.caseId === caseId),

  getMedicalRecordsByCaseId: (caseId) => 
    get().medicalRecords.filter(mr => mr.caseId === caseId),

  getAdoptionRecordByCaseId: (caseId) => 
    get().adoptionRecords.find(ar => ar.caseId === caseId),

  getReviewLogsByCaseId: (caseId) => 
    get().reviewLogs.filter(rl => rl.caseId === caseId),

  getTimelineEventsByCaseId: (caseId) => 
    get().timelineEvents
      .filter(te => te.caseId === caseId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),

  getSupplyUsagesByCaseId: (caseId) => 
    get().supplyUsages.filter(su => su.caseId === caseId),

  addFosterRecord: (record) => set((state) => ({
    fosterRecords: [...state.fosterRecords, record],
  })),

  addSupplyUsage: (usage) => set((state) => ({
    supplyUsages: [...state.supplyUsages, usage],
  })),

  addMedicalRecord: (record) => set((state) => ({
    medicalRecords: [...state.medicalRecords, record],
  })),

  addTimelineEvent: (event) => set((state) => ({
    timelineEvents: [...state.timelineEvents, event],
  })),

  updateCaseStatus: (caseId, status) => set((state) => ({
    cases: state.cases.map(c => 
      c.id === caseId ? { ...c, status, updatedAt: new Date().toISOString() } : c
    ),
  })),

  addReviewLog: (log) => set((state) => ({
    reviewLogs: [...state.reviewLogs, log],
  })),

  getFilteredCases: () => {
    const { cases, filters } = get();
    let filtered = [...cases];

    if (filters.status?.length) {
      filtered = filtered.filter(c => filters.status!.includes(c.status));
    }

    if (filters.medicalStatus?.length) {
      filtered = filtered.filter(c => filters.medicalStatus!.includes(c.medicalStatus));
    }

    if (filters.assignee) {
      filtered = filtered.filter(c => c.assignee === filters.assignee);
    }

    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      filtered = filtered.filter(c => 
        c.animalName.toLowerCase().includes(keyword) ||
        c.caseNo.toLowerCase().includes(keyword) ||
        c.breed.toLowerCase().includes(keyword) ||
        c.rescueLocation.toLowerCase().includes(keyword)
      );
    }

    if (filters.dateRange?.start && filters.dateRange?.end) {
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      filtered = filtered.filter(c => {
        const date = new Date(c.rescueDate);
        return date >= start && date <= end;
      });
    }

    return filtered;
  },
}));
