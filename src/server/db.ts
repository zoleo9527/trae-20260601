import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { BalanceRecord, InspectionRecord, OperationLog, User, WorkOrder } from '$lib/types';

const users: User[] = [
  { id: '1', name: '王前台', role: '前台', username: 'front', password: '123456' },
  { id: '2', name: '李技师', role: '技师', username: 'tech', password: '123456' },
  { id: '3', name: '张店长', role: '店长', username: 'manager', password: '123456' }
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, '../../data/tire_shop.db');

import fs from 'fs';
const dataDir = join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

function initDB(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS workOrders (
      id TEXT PRIMARY KEY,
      plateNumber TEXT NOT NULL,
      customerName TEXT NOT NULL,
      phone TEXT,
      vehicleModel TEXT,
      tireType TEXT,
      createdBy TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '进行中',
      needsReinspection INTEGER NOT NULL DEFAULT 0,
      balanceUpdatedAfterInspection INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_workOrders_plateNumber ON workOrders(plateNumber);
    CREATE INDEX IF NOT EXISTS idx_workOrders_customerName ON workOrders(customerName);
    CREATE INDEX IF NOT EXISTS idx_workOrders_status ON workOrders(status);
    CREATE INDEX IF NOT EXISTS idx_workOrders_createdAt ON workOrders(createdAt);
    
    CREATE TABLE IF NOT EXISTS balanceRecords (
      id TEXT PRIMARY KEY,
      workOrderId TEXT NOT NULL,
      wheelPosition TEXT NOT NULL,
      balanceValue INTEGER NOT NULL,
      beforeValue INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT '待处理',
      technicianId TEXT NOT NULL,
      remark TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_balanceRecords_workOrderId ON balanceRecords(workOrderId);
    
    CREATE TABLE IF NOT EXISTS inspectionRecords (
      id TEXT PRIMARY KEY,
      workOrderId TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT '待质检',
      inspectorId TEXT NOT NULL,
      checkItems TEXT NOT NULL DEFAULT '[]',
      passedItems TEXT NOT NULL DEFAULT '[]',
      failedItems TEXT NOT NULL DEFAULT '[]',
      remark TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_inspectionRecords_workOrderId ON inspectionRecords(workOrderId);
    
    CREATE TABLE IF NOT EXISTS operationLogs (
      id TEXT PRIMARY KEY,
      workOrderId TEXT NOT NULL,
      action TEXT NOT NULL,
      operatorId TEXT NOT NULL,
      operatorName TEXT NOT NULL,
      operatorRole TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      details TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_operationLogs_workOrderId ON operationLogs(workOrderId);
    CREATE INDEX IF NOT EXISTS idx_operationLogs_timestamp ON operationLogs(timestamp);
  `);
}

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

initDB();

export function getUserByUsername(username: string): User | null {
  return users.find(u => u.username === username) || null;
}

export function validateUser(username: string, password: string): User | null {
  const user = getUserByUsername(username);
  if (user && user.password === password) {
    return user;
  }
  return null;
}

export function createWorkOrder(data: Omit<WorkOrder, 'id' | 'balanceRecords' | 'inspectionRecord' | 'createdAt' | 'updatedAt' | 'needsReinspection' | 'balanceUpdatedAfterInspection'>): string {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO workOrders (id, plateNumber, customerName, phone, vehicleModel, tireType, createdBy, status, needsReinspection, balanceUpdatedAfterInspection, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, data.plateNumber, data.customerName, data.phone, data.vehicleModel, data.tireType, data.createdBy, data.status || '进行中', 0, 0, now, now);
  
  return id;
}

export function getWorkOrders(filter?: {
  plateNumber?: string;
  customerName?: string;
  status?: string;
}): WorkOrder[] {
  let query = `SELECT * FROM workOrders WHERE 1=1`;
  const params: any[] = [];
  
  if (filter?.plateNumber) {
    query += ` AND plateNumber LIKE ?`;
    params.push(`%${filter.plateNumber}%`);
  }
  if (filter?.customerName) {
    query += ` AND customerName LIKE ?`;
    params.push(`%${filter.customerName}%`);
  }
  if (filter?.status) {
    query += ` AND status = ?`;
    params.push(filter.status);
  }
  
  query += ` ORDER BY createdAt DESC`;
  
  const results = db.prepare(query).all(params) as any[];
  
  return results.map(order => ({
    ...order,
    needsReinspection: Boolean(order.needsReinspection),
    balanceUpdatedAfterInspection: Boolean(order.balanceUpdatedAfterInspection),
    balanceRecords: getBalanceRecords(order.id),
    inspectionRecord: getInspectionRecord(order.id)
  }));
}

export function getWorkOrderById(id: string): WorkOrder | null {
  const result = db.prepare(`SELECT * FROM workOrders WHERE id = ?`).get(id) as any;
  
  if (!result) {
    return null;
  }
  
  return {
    ...result,
    needsReinspection: Boolean(result.needsReinspection),
    balanceUpdatedAfterInspection: Boolean(result.balanceUpdatedAfterInspection),
    balanceRecords: getBalanceRecords(id),
    inspectionRecord: getInspectionRecord(id)
  };
}

export function updateWorkOrder(id: string, data: Partial<WorkOrder>): void {
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.plateNumber !== undefined) { updates.push('plateNumber = ?'); params.push(data.plateNumber); }
  if (data.customerName !== undefined) { updates.push('customerName = ?'); params.push(data.customerName); }
  if (data.phone !== undefined) { updates.push('phone = ?'); params.push(data.phone); }
  if (data.vehicleModel !== undefined) { updates.push('vehicleModel = ?'); params.push(data.vehicleModel); }
  if (data.tireType !== undefined) { updates.push('tireType = ?'); params.push(data.tireType); }
  if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
  if (data.needsReinspection !== undefined) { updates.push('needsReinspection = ?'); params.push(data.needsReinspection ? 1 : 0); }
  if (data.balanceUpdatedAfterInspection !== undefined) { updates.push('balanceUpdatedAfterInspection = ?'); params.push(data.balanceUpdatedAfterInspection ? 1 : 0); }
  
  updates.push('updatedAt = ?');
  params.push(new Date().toISOString());
  params.push(id);
  
  const stmt = db.prepare(`UPDATE workOrders SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(params);
}

export function createBalanceRecord(data: Omit<BalanceRecord, 'id' | 'createdAt' | 'updatedAt'>): string {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO balanceRecords (id, workOrderId, wheelPosition, balanceValue, beforeValue, status, technicianId, remark, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, data.workOrderId, data.wheelPosition, data.balanceValue, data.beforeValue, data.status, data.technicianId, data.remark, now, now);
  
  const order = getWorkOrderById(data.workOrderId);
  if (order && order.inspectionRecord && order.inspectionRecord.status === '质检通过') {
    resetInspectionStatus(data.workOrderId);
  }
  
  return id;
}

export function updateBalanceRecord(id: string, data: Partial<BalanceRecord>): void {
  const record = db.prepare(`SELECT * FROM balanceRecords WHERE id = ?`).get(id) as any;
  const workOrderId = record.workOrderId;
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.wheelPosition !== undefined) { updates.push('wheelPosition = ?'); params.push(data.wheelPosition); }
  if (data.balanceValue !== undefined) { updates.push('balanceValue = ?'); params.push(data.balanceValue); }
  if (data.beforeValue !== undefined) { updates.push('beforeValue = ?'); params.push(data.beforeValue); }
  if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
  if (data.technicianId !== undefined) { updates.push('technicianId = ?'); params.push(data.technicianId); }
  if (data.remark !== undefined) { updates.push('remark = ?'); params.push(data.remark); }
  
  updates.push('updatedAt = ?');
  params.push(new Date().toISOString());
  params.push(id);
  
  const stmt = db.prepare(`UPDATE balanceRecords SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(params);
  
  const order = getWorkOrderById(workOrderId);
  if (order && order.inspectionRecord && order.inspectionRecord.status === '质检通过') {
    resetInspectionStatus(workOrderId);
  }
}

function resetInspectionStatus(workOrderId: string): void {
  updateWorkOrder(workOrderId, { needsReinspection: true, balanceUpdatedAfterInspection: true });
  const inspection = getInspectionRecord(workOrderId);
  if (inspection) {
    updateInspectionRecord(inspection.id, { status: '待重新质检' });
  }
}

export function getBalanceRecords(workOrderId: string): BalanceRecord[] {
  const results = db.prepare(`SELECT * FROM balanceRecords WHERE workOrderId = ? ORDER BY createdAt ASC`).all(workOrderId) as any[];
  return results;
}

export function createInspectionRecord(data: Omit<InspectionRecord, 'id' | 'createdAt' | 'updatedAt'>): string {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO inspectionRecords (id, workOrderId, status, inspectorId, checkItems, passedItems, failedItems, remark, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, data.workOrderId, data.status, data.inspectorId, JSON.stringify(data.checkItems), JSON.stringify(data.passedItems), JSON.stringify(data.failedItems), data.remark, now, now);
  
  updateWorkOrder(data.workOrderId, { needsReinspection: false, balanceUpdatedAfterInspection: false });
  
  return id;
}

export function updateInspectionRecord(id: string, data: Partial<InspectionRecord>): void {
  const record = db.prepare(`SELECT * FROM inspectionRecords WHERE id = ?`).get(id) as any;
  const workOrderId = record.workOrderId;
  
  const updates: string[] = [];
  const params: any[] = [];
  
  if (data.status !== undefined) { updates.push('status = ?'); params.push(data.status); }
  if (data.inspectorId !== undefined) { updates.push('inspectorId = ?'); params.push(data.inspectorId); }
  if (data.checkItems !== undefined) { updates.push('checkItems = ?'); params.push(JSON.stringify(data.checkItems)); }
  if (data.passedItems !== undefined) { updates.push('passedItems = ?'); params.push(JSON.stringify(data.passedItems)); }
  if (data.failedItems !== undefined) { updates.push('failedItems = ?'); params.push(JSON.stringify(data.failedItems)); }
  if (data.remark !== undefined) { updates.push('remark = ?'); params.push(data.remark); }
  
  updates.push('updatedAt = ?');
  params.push(new Date().toISOString());
  params.push(id);
  
  const stmt = db.prepare(`UPDATE inspectionRecords SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(params);
  
  if (data.status === '质检通过') {
    updateWorkOrder(workOrderId, { needsReinspection: false, balanceUpdatedAfterInspection: false });
  }
}

export function getInspectionRecord(workOrderId: string): InspectionRecord | null {
  const result = db.prepare(`SELECT * FROM inspectionRecords WHERE workOrderId = ?`).get(workOrderId) as any;
  
  if (!result) {
    return null;
  }
  
  return {
    ...result,
    checkItems: JSON.parse(result.checkItems),
    passedItems: JSON.parse(result.passedItems),
    failedItems: JSON.parse(result.failedItems)
  };
}

export function createOperationLog(data: Omit<OperationLog, 'id' | 'timestamp'>): void {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO operationLogs (id, workOrderId, action, operatorId, operatorName, operatorRole, timestamp, details)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, data.workOrderId, data.action, data.operatorId, data.operatorName, data.operatorRole, now, data.details);
}

export function getOperationLogs(workOrderId?: string): OperationLog[] {
  let query: string;
  let params: any[] = [];
  
  if (workOrderId) {
    query = `SELECT * FROM operationLogs WHERE workOrderId = ? ORDER BY timestamp DESC`;
    params.push(workOrderId);
  } else {
    query = `SELECT * FROM operationLogs ORDER BY timestamp DESC`;
  }
  
  return db.prepare(query).all(params) as OperationLog[];
}
