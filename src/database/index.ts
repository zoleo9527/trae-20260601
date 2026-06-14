import { v4 as uuidv4 } from 'uuid';
import {
  Application,
  User,
  OperationLog,
  PaymentRecord,
  CertificateRecord,
  MaterialRecord,
  SupplementNotice,
} from '../types';

class Database {
  private users: Map<string, User> = new Map();
  private applications: Map<string, Application> = new Map();
  private operationLogs: Map<string, OperationLog> = new Map();
  private paymentRecords: Map<string, PaymentRecord> = new Map();
  private certificateRecords: Map<string, CertificateRecord> = new Map();
  private materialRecords: Map<string, MaterialRecord> = new Map();
  private supplementNotices: Map<string, SupplementNotice> = new Map();

  generateId(): string {
    return uuidv4();
  }

  now(): Date {
    return new Date();
  }

  addUser(user: Omit<User, 'id'>): User {
    const id = this.generateId();
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmployeeId(employeeId: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.employeeId === employeeId);
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  addApplication(application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Application {
    const id = this.generateId();
    const now = this.now();
    const newApp = { ...application, id, createdAt: now, updatedAt: now };
    this.applications.set(id, newApp);
    return newApp;
  }

  addApplicationWithTimestamps(application: Omit<Application, 'id'> & { createdAt: Date; updatedAt: Date }): Application {
    const id = this.generateId();
    const newApp = { ...application, id };
    this.applications.set(id, newApp);
    return newApp;
  }

  getApplicationById(id: string): Application | undefined {
    const app = this.applications.get(id);
    if (!app) return undefined;
    const payment = this.getPaymentRecordByApplicationId(id);
    const certificate = this.getCertificateRecordByApplicationId(id);
    return {
      ...app,
      payment: payment || app.payment,
      certificate: certificate || app.certificate,
    };
  }

  getApplicationByNo(applicationNo: string): Application | undefined {
    const app = Array.from(this.applications.values()).find(a => a.applicationNo === applicationNo);
    if (!app) return undefined;
    return this.getApplicationById(app.id);
  }

  getApplications(): Application[] {
    return Array.from(this.applications.values())
      .map(app => this.getApplicationById(app.id)!);
  }

  updateApplication(id: string, updates: Partial<Application>): Application | undefined {
    const app = this.applications.get(id);
    if (!app) return undefined;
    const updated = { ...app, ...updates, updatedAt: this.now() };
    this.applications.set(id, updated);
    return updated;
  }

  addOperationLog(log: Omit<OperationLog, 'id' | 'timestamp'>): OperationLog {
    const id = this.generateId();
    const newLog = { ...log, id, timestamp: this.now() };
    this.operationLogs.set(id, newLog);
    return newLog;
  }

  addOperationLogWithTimestamp(log: Omit<OperationLog, 'id'> & { timestamp: Date }): OperationLog {
    const id = this.generateId();
    const newLog = { ...log, id };
    this.operationLogs.set(id, newLog);
    return newLog;
  }

  getLogsByApplicationId(applicationId: string): OperationLog[] {
    return Array.from(this.operationLogs.values())
      .filter(l => l.applicationId === applicationId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  addPaymentRecord(record: Omit<PaymentRecord, 'id'>): PaymentRecord {
    const id = this.generateId();
    const newRecord = { ...record, id };
    this.paymentRecords.set(id, newRecord);
    return newRecord;
  }

  updatePaymentRecord(id: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined {
    const record = this.paymentRecords.get(id);
    if (!record) return undefined;
    const updated = { ...record, ...updates };
    this.paymentRecords.set(id, updated);
    return updated;
  }

  getPaymentRecordByApplicationId(applicationId: string): PaymentRecord | undefined {
    return Array.from(this.paymentRecords.values()).find(p => p.applicationId === applicationId);
  }

  addCertificateRecord(record: Omit<CertificateRecord, 'id'>): CertificateRecord {
    const id = this.generateId();
    const newRecord = { ...record, id };
    this.certificateRecords.set(id, newRecord);
    return newRecord;
  }

  updateCertificateRecord(id: string, updates: Partial<CertificateRecord>): CertificateRecord | undefined {
    const record = this.certificateRecords.get(id);
    if (!record) return undefined;
    const updated = { ...record, ...updates };
    this.certificateRecords.set(id, updated);
    return updated;
  }

  getCertificateRecordByApplicationId(applicationId: string): CertificateRecord | undefined {
    return Array.from(this.certificateRecords.values()).find(c => c.applicationId === applicationId);
  }

  addMaterialRecord(record: Omit<MaterialRecord, 'id'>): MaterialRecord {
    const id = this.generateId();
    const newRecord = { ...record, id };
    this.materialRecords.set(id, newRecord);
    return newRecord;
  }

  getMaterialRecordsByApplicationId(applicationId: string): MaterialRecord[] {
    return Array.from(this.materialRecords.values()).filter(m => true);
  }

  addSupplementNotice(notice: Omit<SupplementNotice, 'id'>): SupplementNotice {
    const id = this.generateId();
    const newNotice = { ...notice, id };
    this.supplementNotices.set(id, newNotice);
    return newNotice;
  }

  updateSupplementNotice(id: string, updates: Partial<SupplementNotice>): SupplementNotice | undefined {
    const notice = this.supplementNotices.get(id);
    if (!notice) return undefined;
    const updated = { ...notice, ...updates };
    this.supplementNotices.set(id, updated);
    return updated;
  }

  getSupplementNoticesByApplicationId(applicationId: string): SupplementNotice[] {
    return Array.from(this.supplementNotices.values())
      .filter(s => s.applicationId === applicationId)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
  }

  clear(): void {
    this.users.clear();
    this.applications.clear();
    this.operationLogs.clear();
    this.paymentRecords.clear();
    this.certificateRecords.clear();
    this.materialRecords.clear();
    this.supplementNotices.clear();
  }
}

export const db = new Database();
