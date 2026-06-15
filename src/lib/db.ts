import type { User, WorkOrder, BalanceRecord, InspectionRecord, OperationLog } from './types';

let users: User[] = [
  { id: '1', name: '王前台', role: '前台', username: 'front', password: '123456' },
  { id: '2', name: '李技师', role: '技师', username: 'tech', password: '123456' },
  { id: '3', name: '张店长', role: '店长', username: 'manager', password: '123456' }
];

let workOrders: WorkOrder[] = [];
let operationLogs: OperationLog[] = [];

function loadFromStorage() {
  try {
    const storedOrders = localStorage.getItem('tire_shop_orders');
    const storedLogs = localStorage.getItem('tire_shop_logs');
    if (storedOrders) workOrders = JSON.parse(storedOrders);
    if (storedLogs) operationLogs = JSON.parse(storedLogs);
  } catch (e) {
    console.error('Failed to load from storage:', e);
  }
}

function saveToStorage() {
  try {
    localStorage.setItem('tire_shop_orders', JSON.stringify(workOrders));
    localStorage.setItem('tire_shop_logs', JSON.stringify(operationLogs));
  } catch (e) {
    console.error('Failed to save to storage:', e);
  }
}

loadFromStorage();

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getUserByUsername(username: string): Promise<User | null> {
  return Promise.resolve(users.find(u => u.username === username) || null);
}

export function createWorkOrder(data: Omit<WorkOrder, 'id' | 'balanceRecords' | 'inspectionRecord' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  workOrders.push({
    id,
    ...data,
    balanceRecords: [],
    inspectionRecord: null,
    createdAt: now,
    updatedAt: now
  });
  
  saveToStorage();
  return Promise.resolve(id);
}

export function getWorkOrders(filter?: {
  plateNumber?: string;
  customerName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<WorkOrder[]> {
  let result = [...workOrders];
  
  if (filter?.plateNumber) {
    result = result.filter(o => o.plateNumber.includes(filter.plateNumber));
  }
  if (filter?.customerName) {
    result = result.filter(o => o.customerName.includes(filter.customerName));
  }
  if (filter?.status) {
    result = result.filter(o => o.status === filter.status);
  }
  if (filter?.startDate) {
    result = result.filter(o => o.createdAt >= filter.startDate);
  }
  if (filter?.endDate) {
    result = result.filter(o => o.createdAt <= filter.endDate + 'T23:59:59.999Z');
  }
  
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return Promise.resolve(result);
}

export function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  return Promise.resolve(workOrders.find(o => o.id === id) || null);
}

export function updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<void> {
  const index = workOrders.findIndex(o => o.id === id);
  if (index !== -1) {
    workOrders[index] = {
      ...workOrders[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    saveToStorage();
  }
  return Promise.resolve();
}

export function createBalanceRecord(data: Omit<BalanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const record: BalanceRecord = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  const order = workOrders.find(o => o.id === data.workOrderId);
  if (order) {
    order.balanceRecords.push(record);
    order.updatedAt = now;
    saveToStorage();
  }
  
  return Promise.resolve(id);
}

export function updateBalanceRecord(id: string, data: Partial<BalanceRecord>): Promise<void> {
  for (const order of workOrders) {
    const recordIndex = order.balanceRecords.findIndex(r => r.id === id);
    if (recordIndex !== -1) {
      order.balanceRecords[recordIndex] = {
        ...order.balanceRecords[recordIndex],
        ...data,
        updatedAt: new Date().toISOString()
      };
      order.updatedAt = new Date().toISOString();
      saveToStorage();
      break;
    }
  }
  return Promise.resolve();
}

export function getBalanceRecords(workOrderId: string): Promise<BalanceRecord[]> {
  const order = workOrders.find(o => o.id === workOrderId);
  return Promise.resolve(order ? [...order.balanceRecords] : []);
}

export function createInspectionRecord(data: Omit<InspectionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = uuidv4();
  const now = new Date().toISOString();
  const record: InspectionRecord = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  const order = workOrders.find(o => o.id === data.workOrderId);
  if (order) {
    order.inspectionRecord = record;
    order.updatedAt = now;
    saveToStorage();
  }
  
  return Promise.resolve(id);
}

export function updateInspectionRecord(id: string, data: Partial<InspectionRecord>): Promise<void> {
  for (const order of workOrders) {
    if (order.inspectionRecord?.id === id) {
      order.inspectionRecord = {
        ...order.inspectionRecord,
        ...data,
        updatedAt: new Date().toISOString()
      };
      order.updatedAt = new Date().toISOString();
      saveToStorage();
      break;
    }
  }
  return Promise.resolve();
}

export function getInspectionRecord(workOrderId: string): Promise<InspectionRecord | null> {
  const order = workOrders.find(o => o.id === workOrderId);
  return Promise.resolve(order?.inspectionRecord || null);
}

export function createOperationLog(data: Omit<OperationLog, 'id' | 'timestamp'>): Promise<void> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  operationLogs.push({
    id,
    ...data,
    timestamp: now
  });
  
  saveToStorage();
  return Promise.resolve();
}

export function getOperationLogs(workOrderId?: string): Promise<OperationLog[]> {
  let result = [...operationLogs];
  
  if (workOrderId) {
    result = result.filter(log => log.workOrderId === workOrderId);
  }
  
  result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return Promise.resolve(result);
}
