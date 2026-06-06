import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import {
  User,
  RepairOrder,
  RepairMaterial,
  RepairFee,
  StatusHistory,
  AuditRecord,
} from '../types';

interface DatabaseData {
  users: User[];
  orders: RepairOrder[];
  materials: RepairMaterial[];
  fees: RepairFee[];
  statusHistories: StatusHistory[];
  auditRecords: AuditRecord[];
}

const DATA_FILE = path.join(__dirname, 'data.json');

function generateId(): string {
  return uuidv4();
}

function now(): Date {
  return new Date();
}

class Database {
  private data: DatabaseData;
  private inMemory: boolean;

  constructor(inMemory: boolean = false) {
    this.inMemory = inMemory;
    this.data = {
      users: [],
      orders: [],
      materials: [],
      fees: [],
      statusHistories: [],
      auditRecords: [],
    };
    if (!inMemory) {
      this.load();
    }
  }

  private load(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          users: parsed.users?.map((u: any) => ({
            ...u,
            createdAt: new Date(u.createdAt),
            updatedAt: new Date(u.updatedAt),
          })) || [],
          orders: parsed.orders?.map((o: any) => ({
            ...o,
            createdAt: new Date(o.createdAt),
            updatedAt: new Date(o.updatedAt),
          })) || [],
          materials: parsed.materials?.map((m: any) => ({
            ...m,
            registeredAt: new Date(m.registeredAt),
          })) || [],
          fees: parsed.fees?.map((f: any) => ({
            ...f,
            registeredAt: new Date(f.registeredAt),
          })) || [],
          statusHistories: parsed.statusHistories?.map((s: any) => ({
            ...s,
            operatedAt: new Date(s.operatedAt),
          })) || [],
          auditRecords: parsed.auditRecords?.map((a: any) => ({
            ...a,
            auditAt: new Date(a.auditAt),
          })) || [],
        };
      }
    } catch (e) {
      console.warn('加载数据文件失败，使用空数据库:', e);
    }
  }

  save(): void {
    if (this.inMemory) {
      return;
    }
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('保存数据文件失败:', e);
    }
  }

  reset(): void {
    this.data = {
      users: [],
      orders: [],
      materials: [],
      fees: [],
      statusHistories: [],
      auditRecords: [],
    };
    if (!this.inMemory && fs.existsSync(DATA_FILE)) {
      fs.unlinkSync(DATA_FILE);
    }
  }

  setMaterials(materials: any[]): void {
    this.data.materials = materials;
  }

  setFees(fees: any[]): void {
    this.data.fees = fees;
  }

  generateId(): string {
    return generateId();
  }

  now(): Date {
    return now();
  }

  get users() {
    return this.data.users;
  }

  get orders() {
    return this.data.orders;
  }

  get materials() {
    return this.data.materials;
  }

  get fees() {
    return this.data.fees;
  }

  get statusHistories() {
    return this.data.statusHistories;
  }

  get auditRecords() {
    return this.data.auditRecords;
  }
}

export const db = new Database();

export function createInMemoryDatabase(): Database {
  return new Database(true);
}

export { Database };
