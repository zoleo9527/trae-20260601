import { CarSource, OperationLog, User, CarStatus, OperationType, UserRole } from './types';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CARS_FILE = path.join(DATA_DIR, 'cars.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`[DB] 读取 ${path.basename(filePath)} 失败，使用默认数据`);
    return fallback;
  }
}

function writeJson(filePath: string, data: any): void {
  try {
    ensureDataDir();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`[DB] 写入 ${path.basename(filePath)} 失败:`, e);
  }
}

function seedUsers(): User[] {
  return [
    { id: 'u_admin', username: 'admin', name: '系统管理员', role: 'admin', phone: '13800000000' },
    { id: 'u_mgr_1', username: 'manager1', name: '张经理', role: 'manager', phone: '13800000001' },
    { id: 'u_mgr_2', username: 'manager2', name: '李经理', role: 'manager', phone: '13800000002' },
    { id: 'u_app_1', username: 'appraiser1', name: '王评估师', role: 'appraiser', phone: '13800000003' },
    { id: 'u_fin_1', username: 'finance1', name: '赵专员', role: 'finance', phone: '13800000004' }
  ];
}

function seedDemoCars(): { cars: CarSource[]; logs: OperationLog[] } {
  const ts = Date.now();
  const cars: CarSource[] = [
    {
      id: uuidv4(),
      carNo: 'CS20260601001',
      brand: '丰田',
      model: '凯美瑞 2.5G 豪华版',
      year: 2021,
      mileage: 58000,
      color: '珍珠白',
      plateNumber: '京A88888',
      vin: 'LFV3A23C4M3XXXX01',
      ownerName: '陈先生',
      ownerPhone: '13911112222',
      sourceChannel: '老客户介绍',
      expectedPrice: 168000,
      currentStatus: 'manager_pending',
      currentHandlerId: 'u_mgr_1',
      createdBy: 'u_admin',
      createdAt: new Date(ts - 3600_000 * 5).toISOString(),
      updatedAt: new Date(ts - 3600_000 * 4).toISOString()
    },
    {
      id: uuidv4(),
      carNo: 'CS20260601002',
      brand: '大众',
      model: '迈腾 380TSI DSG 旗舰型',
      year: 2022,
      mileage: 32000,
      color: '幻影黑',
      plateNumber: '京B66666',
      vin: 'LFV2A23C4N3XXXX02',
      ownerName: '刘女士',
      ownerPhone: '13933334444',
      sourceChannel: '到店咨询',
      expectedPrice: 195000,
      managerPrice: 182000,
      currentStatus: 'appraiser_pending',
      currentHandlerId: 'u_app_1',
      createdBy: 'u_mgr_1',
      createdAt: new Date(ts - 3600_000 * 24).toISOString(),
      updatedAt: new Date(ts - 3600_000 * 20).toISOString()
    }
  ];

  const logs: OperationLog[] = [
    {
      id: uuidv4(),
      carId: cars[0].id,
      operationType: 'create',
      operatorId: 'u_admin',
      operatorName: '系统管理员',
      operatorRole: 'admin',
      fromStatus: null,
      toStatus: 'draft',
      remark: '从旧台账导入车源信息',
      createdAt: new Date(ts - 3600_000 * 5).toISOString()
    },
    {
      id: uuidv4(),
      carId: cars[0].id,
      operationType: 'submit',
      operatorId: 'u_admin',
      operatorName: '系统管理员',
      operatorRole: 'admin',
      fromStatus: 'draft',
      toStatus: 'manager_pending',
      remark: '提交收车经理审核，陈先生急售',
      createdAt: new Date(ts - 3600_000 * 4).toISOString()
    },
    {
      id: uuidv4(),
      carId: cars[1].id,
      operationType: 'create',
      operatorId: 'u_mgr_1',
      operatorName: '张经理',
      operatorRole: 'manager',
      fromStatus: null,
      toStatus: 'draft',
      remark: '客户刘女士到店，迈腾车况不错',
      createdAt: new Date(ts - 3600_000 * 24).toISOString()
    },
    {
      id: uuidv4(),
      carId: cars[1].id,
      operationType: 'manager_approve',
      operatorId: 'u_mgr_1',
      operatorName: '张经理',
      operatorRole: 'manager',
      fromStatus: 'draft',
      toStatus: 'appraiser_pending',
      price: 182000,
      remark: '初步评估18.2万，转评估师现场检测',
      createdAt: new Date(ts - 3600_000 * 20).toISOString()
    }
  ];

  return { cars, logs };
}

class Database {
  users: User[] = [];
  cars: CarSource[] = [];
  logs: OperationLog[] = [];
  private dirty = false;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.load();
  }

  private load(): void {
    ensureDataDir();
    const hasExisting = fs.existsSync(CARS_FILE) || fs.existsSync(LOGS_FILE);

    this.users = readJson<User[]>(USERS_FILE, seedUsers());

    if (hasExisting) {
      this.cars = readJson<CarSource[]>(CARS_FILE, []);
      this.logs = readJson<OperationLog[]>(LOGS_FILE, []);
      console.log(`[DB] 从磁盘加载：${this.cars.length} 台车源，${this.logs.length} 条操作日志`);
    } else {
      const demo = seedDemoCars();
      this.cars = demo.cars;
      this.logs = demo.logs;
      this.persistAll();
      console.log('[DB] 首次启动，已写入种子数据到 data/ 目录');
    }

    if (!fs.existsSync(USERS_FILE)) {
      writeJson(USERS_FILE, this.users);
    }
  }

  private persistAll(): void {
    writeJson(USERS_FILE, this.users);
    writeJson(CARS_FILE, this.cars);
    writeJson(LOGS_FILE, this.logs);
  }

  private scheduleSave(): void {
    this.dirty = true;
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      if (this.dirty) {
        this.persistAll();
        this.dirty = false;
      }
      this.saveTimer = null;
    }, 100);
  }

  forceSave(): void {
    this.persistAll();
    this.dirty = false;
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  findUserByUsername(username: string): User | undefined {
    return this.users.find(u => u.username === username);
  }

  findUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  listUsersByRole(role?: UserRole): User[] {
    return role ? this.users.filter(u => u.role === role) : this.users;
  }

  createCar(data: Omit<CarSource, 'id' | 'carNo' | 'currentStatus' | 'createdAt' | 'updatedAt'> & { currentStatus?: CarStatus }): CarSource {
    const now = new Date();
    const todayPrefix = `CS${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const todayCars = this.cars.filter(c => c.carNo.startsWith(todayPrefix));
    const seq = String(todayCars.length + 1).padStart(3, '0');
    const carNo = `${todayPrefix}${seq}`;
    const car: CarSource = {
      id: uuidv4(),
      carNo,
      brand: data.brand,
      model: data.model,
      year: data.year,
      mileage: data.mileage,
      color: data.color,
      plateNumber: data.plateNumber,
      vin: data.vin,
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      sourceChannel: data.sourceChannel,
      expectedPrice: data.expectedPrice,
      managerPrice: data.managerPrice,
      appraiserPrice: data.appraiserPrice,
      finalPrice: data.finalPrice,
      currentStatus: data.currentStatus || 'draft',
      currentHandlerId: data.currentHandlerId,
      createdBy: data.createdBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    this.cars.unshift(car);
    this.scheduleSave();
    return car;
  }

  updateCar(carId: string, patch: Partial<CarSource>): CarSource | undefined {
    const idx = this.cars.findIndex(c => c.id === carId);
    if (idx === -1) return undefined;
    this.cars[idx] = { ...this.cars[idx], ...patch, updatedAt: new Date().toISOString() };
    this.scheduleSave();
    return this.cars[idx];
  }

  findCarById(carId: string): CarSource | undefined {
    return this.cars.find(c => c.id === carId);
  }

  listCars(filters?: { status?: CarStatus[]; handlerId?: string; createdBy?: string; keyword?: string }): CarSource[] {
    let list = [...this.cars];
    if (filters?.status?.length) list = list.filter(c => filters.status!.includes(c.currentStatus));
    if (filters?.handlerId) list = list.filter(c => c.currentHandlerId === filters.handlerId);
    if (filters?.createdBy) list = list.filter(c => c.createdBy === filters.createdBy);
    if (filters?.keyword) {
      const k = filters.keyword.toLowerCase();
      list = list.filter(c =>
        c.brand.toLowerCase().includes(k) ||
        c.model.toLowerCase().includes(k) ||
        c.carNo.toLowerCase().includes(k) ||
        (c.plateNumber || '').toLowerCase().includes(k) ||
        (c.ownerName || '').toLowerCase().includes(k)
      );
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  addLog(data: Omit<OperationLog, 'id' | 'createdAt'>): OperationLog {
    const log: OperationLog = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...data
    };
    this.logs.push(log);
    this.scheduleSave();
    return log;
  }

  listLogsByCar(carId: string): OperationLog[] {
    return this.logs
      .filter(l => l.carId === carId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  listAllLogs(filters?: { operatorId?: string; operationType?: OperationType[]; from?: string; to?: string }): OperationLog[] {
    let list = [...this.logs];
    if (filters?.operatorId) list = list.filter(l => l.operatorId === filters.operatorId);
    if (filters?.operationType?.length) list = list.filter(l => filters.operationType!.includes(l.operationType));
    if (filters?.from) list = list.filter(l => l.createdAt >= filters.from!);
    if (filters?.to) list = list.filter(l => l.createdAt <= filters.to!);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const db = new Database();
