import { db } from '../data/database.js';
import type {
  UnloadRecord,
  CreateRecordRequest,
  UpdateStatusRequest,
  DiscrepancyRequest,
  AssignDockRequest,
  RecordStatus,
} from '../../shared/types.js';

function generateId(): string {
  return 'r-' + Math.random().toString(36).slice(2, 9);
}

function generateLogId(): string {
  return 'l-' + Math.random().toString(36).slice(2, 9);
}

const VALID_TRANSITIONS: Record<RecordStatus, RecordStatus[]> = {
  pending: ['checkin'],
  checkin: ['unloading', 'pending'],
  unloading: ['finished', 'checkin'],
  finished: ['discrepancy', 'completed', 'unloading'],
  discrepancy: ['completed', 'finished'],
  completed: [],
};

export const recordService = {
  getAllRecords(filters?: { status?: RecordStatus; plateNumber?: string }): UnloadRecord[] {
    let records = [...db.records];
    if (filters?.status) {
      records = records.filter(r => r.status === filters.status);
    }
    if (filters?.plateNumber) {
      records = records.filter(r =>
        r.plateNumber.toLowerCase().includes(filters.plateNumber!.toLowerCase())
      );
    }
    return records.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getRecordById(id: string): UnloadRecord | undefined {
    return db.getRecord(id);
  },

  createRecord(req: CreateRecordRequest): UnloadRecord {
    const now = new Date().toISOString();
    const record: UnloadRecord = {
      id: generateId(),
      plateNumber: req.plateNumber,
      driverName: req.driverName,
      driverPhone: req.driverPhone,
      cargoType: req.cargoType,
      plannedQuantity: req.plannedQuantity,
      status: 'pending',
      createdBy: req.plateNumber,
      createdAt: now,
      updatedAt: now,
    };

    if (req.dockId) {
      const dock = db.getDock(req.dockId);
      if (dock) {
        record.dockId = dock.id;
        record.dockNumber = dock.number;
      }
    }

    db.addRecord(record);

    db.addLog({
      id: generateLogId(),
      recordId: record.id,
      operation: '创建到车计划',
      operatorId: 'system',
      operatorName: '系统',
      operatorRole: 'dispatcher',
      operateTime: now,
    });

    if (req.dockId) {
      const dock = db.getDock(req.dockId);
      if (dock) {
        db.updateDock(req.dockId, {
          status: 'occupied',
          currentRecordId: record.id,
        });
        db.addLog({
          id: generateLogId(),
          recordId: record.id,
          operation: `分配月台 ${dock.number} 号`,
          operatorId: 'system',
          operatorName: '系统',
          operatorRole: 'dispatcher',
          operateTime: now,
        });
      }
    }

    return record;
  },

  updateStatus(id: string, req: UpdateStatusRequest): UnloadRecord | undefined {
    const record = db.getRecord(id);
    if (!record) return undefined;

    if (!VALID_TRANSITIONS[record.status].includes(req.status)) {
      throw new Error(
        `无效的状态流转: ${record.status} -> ${req.status}`
      );
    }

    const now = new Date().toISOString();
    const updates: Partial<UnloadRecord> = { status: req.status };

    if (req.status === 'checkin') {
      updates.checkinTime = now;
    } else if (req.status === 'unloading') {
      updates.startTime = now;
    } else if (req.status === 'finished' || req.status === 'discrepancy') {
      updates.endTime = now;
    }

    const updated = db.updateRecord(id, updates);

    db.addLog({
      id: generateLogId(),
      recordId: id,
      operation: req.remark || `状态变更: ${req.status}`,
      operatorId: req.operatorId,
      operatorName: req.operatorName,
      operatorRole: req.operatorRole,
      operateTime: now,
    });

    if (req.status === 'completed') {
      if (record.dockId) {
        db.updateDock(record.dockId, {
          status: 'idle',
          currentRecordId: undefined,
        });
      }
    }

    return updated;
  },

  registerDiscrepancy(id: string, req: DiscrepancyRequest): UnloadRecord | undefined {
    const record = db.getRecord(id);
    if (!record) return undefined;

    const now = new Date().toISOString();
    const updated = db.updateRecord(id, {
      status: 'discrepancy',
      discrepancyType: req.discrepancyType,
      discrepancyQuantity: req.discrepancyQuantity,
      actualQuantity: req.actualQuantity,
      returnReason: req.returnReason,
      remark: req.remark,
      endTime: now,
    });

    db.addLog({
      id: generateLogId(),
      recordId: id,
      operation: `登记差异`,
      operatorId: req.operatorId,
      operatorName: req.operatorName,
      operatorRole: req.operatorRole,
      operateTime: now,
      remark: req.returnReason || req.remark,
    });

    return updated;
  },

  assignDock(dockId: string, req: AssignDockRequest): UnloadRecord | undefined {
    const record = db.getRecord(req.recordId);
    if (!record) return undefined;

    const dock = db.getDock(dockId);
    if (!dock) return undefined;

    if (record.dockId && record.dockId !== dockId) {
      db.updateDock(record.dockId, {
        status: 'idle',
        currentRecordId: undefined,
      });
    }

    db.updateDock(dockId, {
      status: 'occupied',
      currentRecordId: record.id,
    });

    const now = new Date().toISOString();
    const updated = db.updateRecord(req.recordId, {
      dockId: dock.id,
      dockNumber: dock.number,
    });

    db.addLog({
      id: generateLogId(),
      recordId: req.recordId,
      operation: `分配月台 ${dock.number} 号`,
      operatorId: req.operatorId,
      operatorName: req.operatorName,
      operatorRole: req.operatorRole,
      operateTime: now,
    });

    return updated;
  },

  getOperationLogs(recordId: string) {
    return db.getLogsByRecord(recordId);
  },
};
