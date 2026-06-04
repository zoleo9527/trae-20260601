import { create } from 'zustand';
import type { Batch, BatchStatus, TestRecord, Note, StatusLog, UserRole } from '@/types';
import { mockBatches, mockTestRecords, mockNotes, mockStatusLogs, mockTestTemplates } from '@/data/mock';

interface BatchStore {
  batches: Batch[];
  testRecords: TestRecord[];
  notes: Note[];
  statusLogs: StatusLog[];
  selectedBatchId: string | null;
  isDrawerOpen: boolean;
  testingBatchId: string | null;

  setSelectedBatchId: (id: string | null) => void;
  setIsDrawerOpen: (open: boolean) => void;
  setTestingBatchId: (id: string | null) => void;

  getBatchById: (id: string) => Batch | undefined;
  getTestRecordsByBatchId: (batchId: string) => TestRecord[];
  getNotesByBatchId: (batchId: string) => Note[];
  getStatusLogsByBatchId: (batchId: string) => StatusLog[];
  getTestTemplateByFormula: (formula: string) => typeof mockTestTemplates[number] | undefined;
  getAbnormalBatches: () => Batch[];
  getPendingReleaseBatches: () => Batch[];
  getTestingBatches: () => Batch[];

  updateBatchStatus: (batchId: string, status: BatchStatus, operatedBy: string, role: UserRole, remark: string) => void;
  addNote: (batchId: string, content: string, createdBy: string, role: UserRole, source?: Note['source']) => void;
  addTestRecord: (record: Omit<TestRecord, 'id'>) => void;
  completeTesting: (
    batchId: string,
    testedBy: string,
    isAbnormal: boolean,
    conclusion: string,
    items: Omit<import('@/types').TestItem, 'id' | 'testRecordId'>[],
    testingNote: string,
  ) => void;
  batchCompleteTesting: (batchIds: string[], testedBy: string) => void;
  batchRelease: (batchIds: string[], operatedBy: string, remark: string) => void;
  batchReject: (batchIds: string[], operatedBy: string, remark: string) => void;

  getStats: () => {
    pending: number;
    testing: number;
    abnormal: number;
    passed: number;
    released: number;
    rejected: number;
  };
}

export const useBatchStore = create<BatchStore>((set, get) => ({
  batches: mockBatches,
  testRecords: mockTestRecords,
  notes: mockNotes,
  statusLogs: mockStatusLogs,
  selectedBatchId: null,
  isDrawerOpen: false,
  testingBatchId: null,

  setSelectedBatchId: (id) => set({ selectedBatchId: id }),
  setIsDrawerOpen: (open) => set({ isDrawerOpen: open }),
  setTestingBatchId: (id) => set({ testingBatchId: id }),

  getBatchById: (id) => get().batches.find((b) => b.id === id),
  getTestRecordsByBatchId: (batchId) =>
    get().testRecords.filter((r) => r.batchId === batchId).sort((a, b) =>
      new Date(b.testedAt).getTime() - new Date(a.testedAt).getTime()
    ),
  getNotesByBatchId: (batchId) =>
    get().notes.filter((n) => n.batchId === batchId).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  getStatusLogsByBatchId: (batchId) =>
    get().statusLogs.filter((l) => l.batchId === batchId).sort((a, b) =>
      new Date(b.operatedAt).getTime() - new Date(a.operatedAt).getTime()
    ),
  getTestTemplateByFormula: (formula) =>
    mockTestTemplates.find((t) => t.formula === formula),
  getAbnormalBatches: () =>
    get().batches.filter((b) => b.currentStatus === 'TEST_ABNORMAL' || b.currentStatus === 'REJECTED'),
  getPendingReleaseBatches: () =>
    get().batches.filter((b) => b.currentStatus === 'TEST_PASSED' || b.currentStatus === 'TEST_ABNORMAL'),
  getTestingBatches: () =>
    get().batches.filter((b) => b.currentStatus === 'TESTING'),

  updateBatchStatus: (batchId, status, operatedBy, role, remark) => {
    const batch = get().getBatchById(batchId);
    if (!batch) return;

    const newLog: StatusLog = {
      id: `log-${Date.now()}`,
      batchId,
      fromStatus: batch.currentStatus,
      toStatus: status,
      operatedBy,
      role,
      operatedAt: new Date().toISOString(),
      remark,
    };

    set((state) => ({
      batches: state.batches.map((b) =>
        b.id === batchId ? { ...b, currentStatus: status } : b
      ),
      statusLogs: [...state.statusLogs, newLog],
    }));
  },

  addNote: (batchId, content, createdBy, role, source = 'manual') => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      batchId,
      content,
      createdBy,
      role,
      createdAt: new Date().toISOString(),
      source,
    };

    set((state) => ({
      notes: [...state.notes, newNote],
    }));
  },

  addTestRecord: (record) => {
    const newRecord: TestRecord = {
      ...record,
      id: `test-${Date.now()}`,
    };

    set((state) => ({
      testRecords: [...state.testRecords, newRecord],
    }));
  },

  completeTesting: (batchId, testedBy, isAbnormal, conclusion, items, testingNote) => {
    const batch = get().getBatchById(batchId);
    if (!batch) return;

    const newTestRecord: TestRecord = {
      id: `test-${Date.now()}`,
      batchId,
      testedBy,
      testedAt: new Date().toISOString(),
      isAbnormal,
      conclusion,
      items: items.map((item, i) => ({
        ...item,
        id: `item-${Date.now()}-${i}`,
        testRecordId: `test-${Date.now()}`,
      })),
    };

    const newStatus: BatchStatus = isAbnormal ? 'TEST_ABNORMAL' : 'TEST_PASSED';
    const remark = isAbnormal ? '检测异常：' + conclusion : '检测通过，待放行';

    const newLog: StatusLog = {
      id: `log-${Date.now()}`,
      batchId,
      fromStatus: batch.currentStatus,
      toStatus: newStatus,
      operatedBy: testedBy,
      role: 'packaging',
      operatedAt: new Date().toISOString(),
      remark,
    };

    const newNote: Note = {
      id: `note-${Date.now()}`,
      batchId,
      content: testingNote || (isAbnormal ? '检测异常：' + conclusion : '检测完成：' + conclusion),
      createdBy: testedBy,
      role: 'packaging',
      createdAt: new Date().toISOString(),
      source: 'testing',
    };

    set((state) => ({
      batches: state.batches.map((b) =>
        b.id === batchId ? { ...b, currentStatus: newStatus } : b
      ),
      testRecords: [...state.testRecords, newTestRecord],
      statusLogs: [...state.statusLogs, newLog],
      notes: [...state.notes, newNote],
      testingBatchId: null,
    }));
  },

  batchCompleteTesting: (batchIds, testedBy) => {
    const newTestRecords: TestRecord[] = [];
    const newLogs: StatusLog[] = [];
    const newNotes: Note[] = [];
    const now = Date.now();

    batchIds.forEach((batchId, idx) => {
      const batch = get().getBatchById(batchId);
      if (!batch) return;
      if (batch.currentStatus !== 'TESTING') return;

      const template = mockTestTemplates.find((t) => t.formula === batch.formula);
      const items = template?.items.map((item, i) => ({
        id: `item-${now}-${idx}-${i}`,
        testRecordId: `test-${now}-${idx}`,
        itemName: item.itemName,
        standard: item.standard,
        value: item.standard,
        isPass: true,
      })) || [];

      newTestRecords.push({
        id: `test-${now}-${idx}`,
        batchId,
        testedBy,
        testedAt: new Date().toISOString(),
        isAbnormal: false,
        conclusion: '批量检测通过，各项指标正常',
        items,
      });

      newLogs.push({
        id: `log-${now}-${idx}`,
        batchId,
        fromStatus: batch.currentStatus,
        toStatus: 'TEST_PASSED',
        operatedBy: testedBy,
        role: 'packaging',
        operatedAt: new Date().toISOString(),
        remark: '批量检测通过，待放行',
      });

      newNotes.push({
        id: `note-${now}-${idx}`,
        batchId,
        content: '批量检测通过，各项指标正常，放行判断请参考检测模板标准值',
        createdBy: testedBy,
        role: 'packaging',
        createdAt: new Date().toISOString(),
        source: 'testing',
      });
    });

    set((state) => ({
      batches: state.batches.map((b) =>
        batchIds.includes(b.id) && b.currentStatus === 'TESTING'
          ? { ...b, currentStatus: 'TEST_PASSED' as BatchStatus }
          : b
      ),
      testRecords: [...state.testRecords, ...newTestRecords],
      statusLogs: [...state.statusLogs, ...newLogs],
      notes: [...state.notes, ...newNotes],
    }));
  },

  batchRelease: (batchIds, operatedBy, remark) => {
    const newLogs: StatusLog[] = [];
    const newNotes: Note[] = [];

    batchIds.forEach((batchId) => {
      const batch = get().getBatchById(batchId);
      if (!batch) return;
      if (batch.currentStatus !== 'TEST_PASSED' && batch.currentStatus !== 'TEST_ABNORMAL') return;

      newLogs.push({
        id: `log-${Date.now()}-${batchId}`,
        batchId,
        fromStatus: batch.currentStatus,
        toStatus: 'RELEASED',
        operatedBy,
        role: 'sales',
        operatedAt: new Date().toISOString(),
        remark: remark || '已放行，可安排发货',
      });

      if (remark) {
        newNotes.push({
          id: `note-${Date.now()}-${batchId}`,
          batchId,
          content: remark,
          createdBy: operatedBy,
          role: 'sales',
          createdAt: new Date().toISOString(),
          source: 'release',
        });
      }
    });

    set((state) => ({
      batches: state.batches.map((b) =>
        batchIds.includes(b.id) && (b.currentStatus === 'TEST_PASSED' || b.currentStatus === 'TEST_ABNORMAL')
          ? { ...b, currentStatus: 'RELEASED' as BatchStatus }
          : b
      ),
      statusLogs: [...state.statusLogs, ...newLogs],
      notes: [...state.notes, ...newNotes],
    }));
  },

  batchReject: (batchIds, operatedBy, remark) => {
    const newLogs: StatusLog[] = [];
    const newNotes: Note[] = [];

    batchIds.forEach((batchId) => {
      const batch = get().getBatchById(batchId);
      if (!batch) return;
      if (batch.currentStatus !== 'TEST_PASSED' && batch.currentStatus !== 'TEST_ABNORMAL') return;

      newLogs.push({
        id: `log-${Date.now()}-${batchId}`,
        batchId,
        fromStatus: batch.currentStatus,
        toStatus: 'REJECTED',
        operatedBy,
        role: 'sales',
        operatedAt: new Date().toISOString(),
        remark: remark || '已拒签，退回重检',
      });

      newNotes.push({
        id: `note-${Date.now()}-${batchId}`,
        batchId,
        content: remark || '已拒签，退回重检',
        createdBy: operatedBy,
        role: 'sales',
        createdAt: new Date().toISOString(),
        source: 'release',
      });
    });

    set((state) => ({
      batches: state.batches.map((b) =>
        batchIds.includes(b.id) && (b.currentStatus === 'TEST_PASSED' || b.currentStatus === 'TEST_ABNORMAL')
          ? { ...b, currentStatus: 'REJECTED' as BatchStatus }
          : b
      ),
      statusLogs: [...state.statusLogs, ...newLogs],
      notes: [...state.notes, ...newNotes],
    }));
  },

  getStats: () => {
    const { batches } = get();
    return {
      pending: batches.filter((b) => b.currentStatus === 'PENDING_TEST').length,
      testing: batches.filter((b) => b.currentStatus === 'TESTING').length,
      abnormal: batches.filter((b) => b.currentStatus === 'TEST_ABNORMAL').length,
      passed: batches.filter((b) => b.currentStatus === 'TEST_PASSED').length,
      released: batches.filter((b) => b.currentStatus === 'RELEASED').length,
      rejected: batches.filter((b) => b.currentStatus === 'REJECTED').length,
    };
  },
}));
