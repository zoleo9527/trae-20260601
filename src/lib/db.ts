import type { User, WorkOrder, BalanceRecord, InspectionRecord, OperationLog } from './types';

let db: IDBDatabase | null = null;

const users: User[] = [
  { id: '1', name: '王前台', role: '前台', username: 'front', password: '123456' },
  { id: '2', name: '李技师', role: '技师', username: 'tech', password: '123456' },
  { id: '3', name: '张店长', role: '店长', username: 'manager', password: '123456' }
];

function initDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TireShopDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };
    
    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains('workOrders')) {
        const workOrderStore = database.createObjectStore('workOrders', { keyPath: 'id' });
        workOrderStore.createIndex('plateNumber', 'plateNumber', { unique: false });
        workOrderStore.createIndex('customerName', 'customerName', { unique: false });
        workOrderStore.createIndex('status', 'status', { unique: false });
        workOrderStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
      if (!database.objectStoreNames.contains('balanceRecords')) {
        const balanceStore = database.createObjectStore('balanceRecords', { keyPath: 'id' });
        balanceStore.createIndex('workOrderId', 'workOrderId', { unique: false });
      }
      
      if (!database.objectStoreNames.contains('inspectionRecords')) {
        const inspectionStore = database.createObjectStore('inspectionRecords', { keyPath: 'id' });
        inspectionStore.createIndex('workOrderId', 'workOrderId', { unique: true });
      }
      
      if (!database.objectStoreNames.contains('operationLogs')) {
        const logStore = database.createObjectStore('operationLogs', { keyPath: 'id' });
        logStore.createIndex('workOrderId', 'workOrderId', { unique: false });
        logStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function getUserByUsername(username: string): Promise<User | null> {
  await initDB();
  return Promise.resolve(users.find(u => u.username === username) || null);
}

export async function createWorkOrder(data: Omit<WorkOrder, 'id' | 'balanceRecords' | 'inspectionRecord' | 'createdAt' | 'updatedAt' | 'needsReinspection' | 'balanceUpdatedAfterInspection'>): Promise<string> {
  await initDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const order: WorkOrder = {
    id,
    ...data,
    balanceRecords: [],
    inspectionRecord: null,
    createdAt: now,
    updatedAt: now,
    needsReinspection: false,
    balanceUpdatedAfterInspection: false
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['workOrders'], 'readwrite');
    const store = transaction.objectStore('workOrders');
    const request = store.add(order);
    
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function getWorkOrders(filter?: {
  plateNumber?: string;
  customerName?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): Promise<WorkOrder[]> {
  await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['workOrders'], 'readonly');
    const store = transaction.objectStore('workOrders');
    const request = store.getAll();
    
    request.onsuccess = async () => {
      let results: WorkOrder[] = request.result;
      
      if (filter?.plateNumber) {
        results = results.filter(o => o.plateNumber.includes(filter.plateNumber));
      }
      if (filter?.customerName) {
        results = results.filter(o => o.customerName.includes(filter.customerName));
      }
      if (filter?.status) {
        results = results.filter(o => o.status === filter.status);
      }
      if (filter?.startDate) {
        results = results.filter(o => o.createdAt >= filter.startDate);
      }
      if (filter?.endDate) {
        results = results.filter(o => o.createdAt <= filter.endDate + 'T23:59:59.999Z');
      }
      
      for (const order of results) {
        order.balanceRecords = await getBalanceRecords(order.id);
        order.inspectionRecord = await getInspectionRecord(order.id);
      }
      
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      resolve(results);
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function getWorkOrderById(id: string): Promise<WorkOrder | null> {
  await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['workOrders'], 'readonly');
    const store = transaction.objectStore('workOrders');
    const request = store.get(id);
    
    request.onsuccess = async () => {
      if (!request.result) {
        resolve(null);
        return;
      }
      
      const order = request.result as WorkOrder;
      order.balanceRecords = await getBalanceRecords(id);
      order.inspectionRecord = await getInspectionRecord(id);
      resolve(order);
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<void> {
  await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['workOrders'], 'readwrite');
    const store = transaction.objectStore('workOrders');
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const order = getRequest.result as WorkOrder;
      const updatedOrder = {
        ...order,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      const putRequest = store.put(updatedOrder);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function createBalanceRecord(data: Omit<BalanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  await initDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const record: BalanceRecord = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['balanceRecords', 'workOrders', 'inspectionRecords'], 'readwrite');
    const balanceStore = transaction.objectStore('balanceRecords');
    
    balanceStore.add(record).onsuccess = async () => {
      const order = await getWorkOrderById(data.workOrderId);
      if (order && order.inspectionRecord && order.inspectionRecord.status === '质检通过') {
        const workOrderStore = transaction.objectStore('workOrders');
        const inspectionStore = transaction.objectStore('inspectionRecords');
        
        workOrderStore.get(data.workOrderId).onsuccess = (event) => {
          const wo = (event.target as IDBRequest).result;
          wo.needsReinspection = true;
          wo.balanceUpdatedAfterInspection = true;
          wo.updatedAt = now;
          workOrderStore.put(wo);
        };
        
        inspectionStore.index('workOrderId').get(data.workOrderId).onsuccess = (event) => {
          const ir = (event.target as IDBRequest).result;
          if (ir) {
            ir.status = '待重新质检';
            ir.updatedAt = now;
            inspectionStore.put(ir);
          }
        };
      }
      resolve(id);
    };
    
    balanceStore.onerror = () => reject(balanceStore.error);
  });
}

export async function updateBalanceRecord(id: string, data: Partial<BalanceRecord>): Promise<void> {
  await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['balanceRecords', 'workOrders', 'inspectionRecords'], 'readwrite');
    const balanceStore = transaction.objectStore('balanceRecords');
    
    balanceStore.get(id).onsuccess = (event) => {
      const record = (event.target as IDBRequest).result as BalanceRecord;
      const workOrderId = record.workOrderId;
      
      const updatedRecord = {
        ...record,
        ...data,
        updatedAt: new Date().toISOString()
      };
      
      balanceStore.put(updatedRecord).onsuccess = async () => {
        const order = await getWorkOrderById(workOrderId);
        if (order && order.inspectionRecord && order.inspectionRecord.status === '质检通过') {
          const workOrderStore = transaction.objectStore('workOrders');
          const inspectionStore = transaction.objectStore('inspectionRecords');
          const now = new Date().toISOString();
          
          workOrderStore.get(workOrderId).onsuccess = (e) => {
            const wo = (e.target as IDBRequest).result;
            wo.needsReinspection = true;
            wo.balanceUpdatedAfterInspection = true;
            wo.updatedAt = now;
            workOrderStore.put(wo);
          };
          
          inspectionStore.index('workOrderId').get(workOrderId).onsuccess = (e) => {
            const ir = (e.target as IDBRequest).result;
            if (ir) {
              ir.status = '待重新质检';
              ir.updatedAt = now;
              inspectionStore.put(ir);
            }
          };
        }
        resolve();
      };
      
      balanceStore.onerror = () => reject(balanceStore.error);
    };
    
    balanceStore.onerror = () => reject(balanceStore.error);
  });
}

export async function getBalanceRecords(workOrderId: string): Promise<BalanceRecord[]> {
  await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['balanceRecords'], 'readonly');
    const store = transaction.objectStore('balanceRecords');
    const index = store.index('workOrderId');
    const request = index.getAll(workOrderId);
    
    request.onsuccess = () => {
      const results = request.result as BalanceRecord[];
      results.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      resolve(results);
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function createInspectionRecord(data: Omit<InspectionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  await initDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const record: InspectionRecord = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['inspectionRecords', 'workOrders'], 'readwrite');
    const inspectionStore = transaction.objectStore('inspectionRecords');
    
    inspectionStore.add(record).onsuccess = () => {
      const workOrderStore = transaction.objectStore('workOrders');
      workOrderStore.get(data.workOrderId).onsuccess = (event) => {
        const wo = (event.target as IDBRequest).result;
        wo.needsReinspection = false;
        wo.balanceUpdatedAfterInspection = false;
        wo.updatedAt = now;
        workOrderStore.put(wo);
      };
      resolve(id);
    };
    
    inspectionStore.onerror = () => reject(inspectionStore.error);
  });
}

export async function updateInspectionRecord(id: string, data: Partial<InspectionRecord>): Promise<void> {
  await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['inspectionRecords', 'workOrders'], 'readwrite');
    const inspectionStore = transaction.objectStore('inspectionRecords');
    
    inspectionStore.get(id).onsuccess = (event) => {
      const record = (event.target as IDBRequest).result as InspectionRecord;
      const workOrderId = record.workOrderId;
      const now = new Date().toISOString();
      
      const updatedRecord = {
        ...record,
        ...data,
        updatedAt: now
      };
      
      inspectionStore.put(updatedRecord).onsuccess = () => {
        if (data.status === '质检通过') {
          const workOrderStore = transaction.objectStore('workOrders');
          workOrderStore.get(workOrderId).onsuccess = (e) => {
            const wo = (e.target as IDBRequest).result;
            wo.needsReinspection = false;
            wo.balanceUpdatedAfterInspection = false;
            wo.updatedAt = now;
            workOrderStore.put(wo);
          };
        }
        resolve();
      };
      
      inspectionStore.onerror = () => reject(inspectionStore.error);
    };
    
    inspectionStore.onerror = () => reject(inspectionStore.error);
  });
}

export async function getInspectionRecord(workOrderId: string): Promise<InspectionRecord | null> {
  await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['inspectionRecords'], 'readonly');
    const store = transaction.objectStore('inspectionRecords');
    const index = store.index('workOrderId');
    const request = index.get(workOrderId);
    
    request.onsuccess = () => {
      resolve(request.result as InspectionRecord | null);
    };
    
    request.onerror = () => reject(request.error);
  });
}

export async function createOperationLog(data: Omit<OperationLog, 'id' | 'timestamp'>): Promise<void> {
  await initDB();
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const log: OperationLog = {
    id,
    ...data,
    timestamp: now
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['operationLogs'], 'readwrite');
    const store = transaction.objectStore('operationLogs');
    const request = store.add(log);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getOperationLogs(workOrderId?: string): Promise<OperationLog[]> {
  await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db!.transaction(['operationLogs'], 'readonly');
    const store = transaction.objectStore('operationLogs');
    
    let request: IDBRequest;
    if (workOrderId) {
      const index = store.index('workOrderId');
      request = index.getAll(workOrderId);
    } else {
      request = store.getAll();
    }
    
    request.onsuccess = () => {
      const results = request.result as OperationLog[];
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      resolve(results);
    };
    
    request.onerror = () => reject(request.error);
  });
}
