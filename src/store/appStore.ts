import { create } from 'zustand';
import { mockCases, mockRecalls, mockReinspections, mockTraces } from '../data/mockData';
import type { BatchTrace, RecallTask, Reinspection, ReturnCase } from '../types';

interface AppState {
  cases: ReturnCase[];
  traces: Record<string, BatchTrace>;
  reinspections: Record<string, Reinspection>;
  recalls: RecallTask[];
  currentCase: ReturnCase | null;
  setCurrentCase: (caseItem: ReturnCase | null) => void;
  addCase: (caseItem: ReturnCase) => void;
  updateCase: (id: string, updates: Partial<ReturnCase>) => void;
  updateRecallCustomer: (recallId: string, customerId: string, updates: Partial<RecallTask['customers'][0]>) => void;
  updateReinspection: (caseId: string, updates: Partial<Reinspection>) => void;
  createRecallFromCase: (caseId: string) => void;
  completeRecall: (recallId: string, disposition?: string) => void;
  setRecallFinalDisposition: (recallId: string, disposition: string) => void;
}

const mockContacts: Record<string, { contact: string; phone: string }> = {
  '北京鑫源餐饮有限公司': { contact: '张经理', phone: '138****1234' },
  '天津美食城': { contact: '李总', phone: '139****5678' },
  '上海鲜天下食品有限公司': { contact: '周经理', phone: '138****5678' },
  '杭州杭帮菜餐饮': { contact: '吴采购', phone: '139****1234' },
  '南京金陵饭店': { contact: '郑总厨', phone: '137****9876' },
  '广州好味道连锁餐饮': { contact: '黄店长', phone: '136****4321' },
  '深圳粤菜馆联盟': { contact: '陈会长', phone: '135****8765' },
};

export const useAppStore = create<AppState>((set, get) => ({
  cases: mockCases,
  traces: mockTraces,
  reinspections: mockReinspections,
  recalls: mockRecalls,
  currentCase: null,
  setCurrentCase: (caseItem) => set({ currentCase: caseItem }),
  addCase: (caseItem) => set((state) => ({ cases: [caseItem, ...state.cases] })),
  updateCase: (id, updates) => set((state) => ({
    cases: state.cases.map((c) => c.id === id ? { ...c, ...updates } : c),
  })),
  updateRecallCustomer: (recallId, customerId, updates) => set((state) => {
    const updatedRecalls = state.recalls.map((r) => {
      if (r.id !== recallId || r.status === 'completed') return r;

      const updatedCustomers = r.customers.map((c) =>
        c.id === customerId ? { ...c, ...updates } : c
      );

      const hasPending = updatedCustomers.some((c) => c.notifyStatus === 'pending');
      const allConfirmedOrReturned = updatedCustomers.every(
        (c) => c.notifyStatus === 'confirmed' || c.notifyStatus === 'returned'
      );
      const canComplete = !hasPending && allConfirmedOrReturned;

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      return {
        ...r,
        customers: updatedCustomers,
        status: 'notifying' as const,
        readyToCompleteAt: canComplete ? now : r.readyToCompleteAt,
      };
    });

    return { recalls: updatedRecalls };
  }),
  updateReinspection: (caseId, updates) => set((state) => ({
    reinspections: {
      ...state.reinspections,
      [caseId]: { ...state.reinspections[caseId], ...updates },
    },
  })),
  completeRecall: (recallId, disposition) => {
    const state = get();
    const recall = state.recalls.find((r) => r.id === recallId);
    if (!recall || recall.status === 'completed') return;

    const hasPending = recall.customers.some((c) => c.notifyStatus === 'pending');
    if (hasPending) return;

    const allConfirmedOrReturned = recall.customers.every(
      (c) => c.notifyStatus === 'confirmed' || c.notifyStatus === 'returned'
    );
    if (!allConfirmedOrReturned) return;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const finalDisp = disposition || recall.finalDisposition;

    set((state) => {
      const updatedRecalls = state.recalls.map((r) =>
        r.id === recallId
          ? {
              ...r,
              status: 'completed' as const,
              completedAt: now,
              finalDisposition: finalDisp,
            }
          : r
      );

      const updatedCases = state.cases.map((c) =>
        c.id === recall.caseId
          ? { ...c, status: 'closed' as const, closedAt: now, closedBy: '李主管' }
          : c
      );

      return { recalls: updatedRecalls, cases: updatedCases };
    });
  },
  setRecallFinalDisposition: (recallId, disposition) => set((state) => ({
    recalls: state.recalls.map((r) =>
      r.id === recallId ? { ...r, finalDisposition: disposition } : r
    ),
  })),
  createRecallFromCase: (caseId) => {
    const state = get();
    const caseItem = state.cases.find((c) => c.id === caseId);
    if (!caseItem) return;

    const existingRecall = state.recalls.find((r) => r.caseId === caseId);
    if (existingRecall) return;

    const trace = state.traces[caseItem.batchNo];
    if (!trace) return;

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const customers = trace.coldStorage.outRecords.map((record, index) => {
      const contactInfo = mockContacts[record.customerName] || { contact: '联系人', phone: '138****0000' };
      return {
        id: `cust-${Date.now()}-${index}`,
        customerName: record.customerName,
        contact: contactInfo.contact,
        phone: contactInfo.phone,
        shippedQuantity: record.quantity,
        shippedDate: record.outTime.slice(0, 10),
        unit: trace.coldStorage.unit,
        notifyStatus: 'pending' as const,
        remark: '',
      };
    });

    const newRecall: RecallTask = {
      id: `recall-${Date.now()}`,
      caseId: caseItem.id,
      caseNo: caseItem.caseNo,
      productName: caseItem.productName,
      batchNo: caseItem.batchNo,
      status: 'notifying',
      createdAt: now,
      reason: caseItem.reasonDetail || '该批次产品存在质量问题，启动产品召回',
      customers,
    };

    set((state) => ({
      recalls: [...state.recalls, newRecall],
    }));
  },
}));
