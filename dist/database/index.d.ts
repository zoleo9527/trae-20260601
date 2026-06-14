import { Application, User, OperationLog, PaymentRecord, CertificateRecord, MaterialRecord, SupplementNotice } from '../types';
declare class Database {
    private users;
    private applications;
    private operationLogs;
    private paymentRecords;
    private certificateRecords;
    private materialRecords;
    private supplementNotices;
    generateId(): string;
    now(): Date;
    addUser(user: Omit<User, 'id'>): User;
    getUserById(id: string): User | undefined;
    getUserByEmployeeId(employeeId: string): User | undefined;
    getUsers(): User[];
    addApplication(application: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>): Application;
    addApplicationWithTimestamps(application: Omit<Application, 'id'> & {
        createdAt: Date;
        updatedAt: Date;
    }): Application;
    getApplicationById(id: string): Application | undefined;
    getApplicationByNo(applicationNo: string): Application | undefined;
    getApplications(): Application[];
    updateApplication(id: string, updates: Partial<Application>): Application | undefined;
    addOperationLog(log: Omit<OperationLog, 'id' | 'timestamp'>): OperationLog;
    addOperationLogWithTimestamp(log: Omit<OperationLog, 'id'> & {
        timestamp: Date;
    }): OperationLog;
    getLogsByApplicationId(applicationId: string): OperationLog[];
    addPaymentRecord(record: Omit<PaymentRecord, 'id'>): PaymentRecord;
    updatePaymentRecord(id: string, updates: Partial<PaymentRecord>): PaymentRecord | undefined;
    getPaymentRecordByApplicationId(applicationId: string): PaymentRecord | undefined;
    addCertificateRecord(record: Omit<CertificateRecord, 'id'>): CertificateRecord;
    updateCertificateRecord(id: string, updates: Partial<CertificateRecord>): CertificateRecord | undefined;
    getCertificateRecordByApplicationId(applicationId: string): CertificateRecord | undefined;
    addMaterialRecord(record: Omit<MaterialRecord, 'id'>): MaterialRecord;
    getMaterialRecordsByApplicationId(applicationId: string): MaterialRecord[];
    addSupplementNotice(notice: Omit<SupplementNotice, 'id'>): SupplementNotice;
    updateSupplementNotice(id: string, updates: Partial<SupplementNotice>): SupplementNotice | undefined;
    getSupplementNoticesByApplicationId(applicationId: string): SupplementNotice[];
    clear(): void;
}
export declare const db: Database;
export {};
