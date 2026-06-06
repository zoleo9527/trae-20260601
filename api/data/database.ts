import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { UnloadRecord, Dock, OperationLog, User } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

interface Database {
  records: UnloadRecord[];
  docks: Dock[];
  logs: OperationLog[];
  users: User[];
}

let inMemoryDb: Database;

function initDatabase(): Database {
  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

  const users: User[] = [
    { id: 'u1', name: '张调度', role: 'dispatcher', phone: '13800138001' },
    { id: 'u2', name: '李班长', role: 'forklift', phone: '13800138002' },
    { id: 'u3', name: '王文员', role: 'clerk', phone: '13800138003' },
  ];

  const docks: Dock[] = Array.from({ length: 10 }, (_, i) => ({
    id: `dock-${i + 1}`,
    number: i + 1,
    status: 'idle' as const,
  }));

  const records: UnloadRecord[] = [
    {
      id: 'r1',
      plateNumber: '京A12345',
      driverName: '刘师傅',
      driverPhone: '13900139001',
      cargoType: '电子产品',
      plannedQuantity: 500,
      actualQuantity: 495,
      dockId: 'dock-1',
      dockNumber: 1,
      status: 'discrepancy',
      checkinTime: hoursAgo(3),
      startTime: hoursAgo(2.5),
      endTime: hoursAgo(1),
      discrepancyType: 'quantity',
      discrepancyQuantity: 5,
      returnReason: '发货方少装',
      remark: '外包装完好，内部清点少5箱',
      createdBy: 'u1',
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'r2',
      plateNumber: '沪B67890',
      driverName: '陈师傅',
      driverPhone: '13900139002',
      cargoType: '食品饮料',
      plannedQuantity: 200,
      dockId: 'dock-2',
      dockNumber: 2,
      status: 'unloading',
      checkinTime: hoursAgo(1.5),
      startTime: hoursAgo(1),
      createdBy: 'u1',
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(1),
    },
    {
      id: 'r3',
      plateNumber: '粤C11111',
      driverName: '赵师傅',
      driverPhone: '13900139003',
      cargoType: '日用百货',
      plannedQuantity: 800,
      dockId: 'dock-3',
      dockNumber: 3,
      status: 'checkin',
      checkinTime: hoursAgo(0.5),
      createdBy: 'u2',
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(0.5),
    },
    {
      id: 'r4',
      plateNumber: '浙D22222',
      driverName: '孙师傅',
      driverPhone: '13900139004',
      cargoType: '服装鞋帽',
      plannedQuantity: 300,
      status: 'pending',
      createdBy: 'u1',
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
    },
    {
      id: 'r5',
      plateNumber: '苏E33333',
      driverName: '周师傅',
      driverPhone: '13900139005',
      cargoType: '家电',
      plannedQuantity: 100,
      actualQuantity: 100,
      dockId: 'dock-5',
      dockNumber: 5,
      status: 'completed',
      checkinTime: hoursAgo(8),
      startTime: hoursAgo(7),
      endTime: hoursAgo(5),
      createdBy: 'u1',
      createdAt: hoursAgo(10),
      updatedAt: hoursAgo(5),
    },
  ];

  docks[0].status = 'occupied';
  docks[0].currentRecordId = 'r1';
  docks[1].status = 'occupied';
  docks[1].currentRecordId = 'r2';
  docks[2].status = 'occupied';
  docks[2].currentRecordId = 'r3';
  docks[4].status = 'idle';

  const logs: OperationLog[] = [
    {
      id: 'l1',
      recordId: 'r1',
      operation: '创建到车计划',
      operatorId: 'u1',
      operatorName: '张调度',
      operatorRole: 'dispatcher',
      operateTime: hoursAgo(4),
    },
    {
      id: 'l2',
      recordId: 'r1',
      operation: '分配月台 1 号',
      operatorId: 'u1',
      operatorName: '张调度',
      operatorRole: 'dispatcher',
      operateTime: hoursAgo(3.5),
    },
    {
      id: 'l3',
      recordId: 'r1',
      operation: '司机签到',
      operatorId: 'u2',
      operatorName: '李班长',
      operatorRole: 'forklift',
      operateTime: hoursAgo(3),
    },
    {
      id: 'l4',
      recordId: 'r1',
      operation: '开始卸货',
      operatorId: 'u2',
      operatorName: '李班长',
      operatorRole: 'forklift',
      operateTime: hoursAgo(2.5),
    },
    {
      id: 'l5',
      recordId: 'r1',
      operation: '卸货完成，发现差异',
      operatorId: 'u2',
      operatorName: '李班长',
      operatorRole: 'forklift',
      operateTime: hoursAgo(1),
    },
    {
      id: 'l6',
      recordId: 'r1',
      operation: '登记差异：少5箱',
      operatorId: 'u3',
      operatorName: '王文员',
      operatorRole: 'clerk',
      operateTime: hoursAgo(0.8),
      remark: '发货方少装',
    },
    {
      id: 'l7',
      recordId: 'r2',
      operation: '创建到车计划',
      operatorId: 'u1',
      operatorName: '张调度',
      operatorRole: 'dispatcher',
      operateTime: hoursAgo(3),
    },
    {
      id: 'l8',
      recordId: 'r2',
      operation: '分配月台 2 号',
      operatorId: 'u1',
      operatorName: '张调度',
      operatorRole: 'dispatcher',
      operateTime: hoursAgo(2),
    },
    {
      id: 'l9',
      recordId: 'r2',
      operation: '司机签到',
      operatorId: 'u2',
      operatorName: '李班长',
      operatorRole: 'forklift',
      operateTime: hoursAgo(1.5),
    },
    {
      id: 'l10',
      recordId: 'r2',
      operation: '开始卸货',
      operatorId: 'u2',
      operatorName: '李班长',
      operatorRole: 'forklift',
      operateTime: hoursAgo(1),
    },
  ];

  return { records, docks, logs, users };
}

function loadDatabase(): Database {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  try {
    const dbPath = path.join(DATA_DIR, 'db.json');
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      inMemoryDb = JSON.parse(data);
      return inMemoryDb;
    }
  } catch {
    // ignore
  }

  inMemoryDb = initDatabase();
  return inMemoryDb;
}

function saveDatabase(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const dbPath = path.join(DATA_DIR, 'db.json');
    fs.writeFileSync(dbPath, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch {
    // ignore
  }
}

export const db = {
  get records(): UnloadRecord[] {
    return loadDatabase().records;
  },
  get docks(): Dock[] {
    return loadDatabase().docks;
  },
  get logs(): OperationLog[] {
    return loadDatabase().logs;
  },
  get users(): User[] {
    return loadDatabase().users;
  },

  addRecord(record: UnloadRecord): void {
    loadDatabase().records.push(record);
    saveDatabase();
  },

  updateRecord(id: string, updates: Partial<UnloadRecord>): UnloadRecord | undefined {
    const db = loadDatabase();
    const idx = db.records.findIndex(r => r.id === id);
    if (idx === -1) return undefined;
    db.records[idx] = { ...db.records[idx], ...updates, updatedAt: new Date().toISOString() };
    saveDatabase();
    return db.records[idx];
  },

  getRecord(id: string): UnloadRecord | undefined {
    return loadDatabase().records.find(r => r.id === id);
  },

  updateDock(id: string, updates: Partial<Dock>): Dock | undefined {
    const db = loadDatabase();
    const idx = db.docks.findIndex(d => d.id === id);
    if (idx === -1) return undefined;
    db.docks[idx] = { ...db.docks[idx], ...updates };
    saveDatabase();
    return db.docks[idx];
  },

  getDock(id: string): Dock | undefined {
    return loadDatabase().docks.find(d => d.id === id);
  },

  addLog(log: OperationLog): void {
    loadDatabase().logs.push(log);
    saveDatabase();
  },

  getLogsByRecord(recordId: string): OperationLog[] {
    return loadDatabase().logs
      .filter(l => l.recordId === recordId)
      .sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime());
  },

  getRecentLogs(limit: number = 20): OperationLog[] {
    return loadDatabase().logs
      .sort((a, b) => new Date(b.operateTime).getTime() - new Date(a.operateTime).getTime())
      .slice(0, limit);
  },
};
