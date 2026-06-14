"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const uuid_1 = require("uuid");
class Database {
    constructor() {
        this.users = new Map();
        this.applications = new Map();
        this.operationLogs = new Map();
        this.paymentRecords = new Map();
        this.certificateRecords = new Map();
        this.materialRecords = new Map();
        this.supplementNotices = new Map();
    }
    generateId() {
        return (0, uuid_1.v4)();
    }
    now() {
        return new Date();
    }
    addUser(user) {
        const id = this.generateId();
        const newUser = { ...user, id };
        this.users.set(id, newUser);
        return newUser;
    }
    getUserById(id) {
        return this.users.get(id);
    }
    getUserByEmployeeId(employeeId) {
        return Array.from(this.users.values()).find(u => u.employeeId === employeeId);
    }
    getUsers() {
        return Array.from(this.users.values());
    }
    addApplication(application) {
        const id = this.generateId();
        const now = this.now();
        const newApp = { ...application, id, createdAt: now, updatedAt: now };
        this.applications.set(id, newApp);
        return newApp;
    }
    addApplicationWithTimestamps(application) {
        const id = this.generateId();
        const newApp = { ...application, id };
        this.applications.set(id, newApp);
        return newApp;
    }
    getApplicationById(id) {
        const app = this.applications.get(id);
        if (!app)
            return undefined;
        const payment = this.getPaymentRecordByApplicationId(id);
        const certificate = this.getCertificateRecordByApplicationId(id);
        return {
            ...app,
            payment: payment || app.payment,
            certificate: certificate || app.certificate,
        };
    }
    getApplicationByNo(applicationNo) {
        const app = Array.from(this.applications.values()).find(a => a.applicationNo === applicationNo);
        if (!app)
            return undefined;
        return this.getApplicationById(app.id);
    }
    getApplications() {
        return Array.from(this.applications.values())
            .map(app => this.getApplicationById(app.id));
    }
    updateApplication(id, updates) {
        const app = this.applications.get(id);
        if (!app)
            return undefined;
        const updated = { ...app, ...updates, updatedAt: this.now() };
        this.applications.set(id, updated);
        return updated;
    }
    addOperationLog(log) {
        const id = this.generateId();
        const newLog = { ...log, id, timestamp: this.now() };
        this.operationLogs.set(id, newLog);
        return newLog;
    }
    addOperationLogWithTimestamp(log) {
        const id = this.generateId();
        const newLog = { ...log, id };
        this.operationLogs.set(id, newLog);
        return newLog;
    }
    getLogsByApplicationId(applicationId) {
        return Array.from(this.operationLogs.values())
            .filter(l => l.applicationId === applicationId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    addPaymentRecord(record) {
        const id = this.generateId();
        const newRecord = { ...record, id };
        this.paymentRecords.set(id, newRecord);
        return newRecord;
    }
    updatePaymentRecord(id, updates) {
        const record = this.paymentRecords.get(id);
        if (!record)
            return undefined;
        const updated = { ...record, ...updates };
        this.paymentRecords.set(id, updated);
        return updated;
    }
    getPaymentRecordByApplicationId(applicationId) {
        return Array.from(this.paymentRecords.values()).find(p => p.applicationId === applicationId);
    }
    addCertificateRecord(record) {
        const id = this.generateId();
        const newRecord = { ...record, id };
        this.certificateRecords.set(id, newRecord);
        return newRecord;
    }
    updateCertificateRecord(id, updates) {
        const record = this.certificateRecords.get(id);
        if (!record)
            return undefined;
        const updated = { ...record, ...updates };
        this.certificateRecords.set(id, updated);
        return updated;
    }
    getCertificateRecordByApplicationId(applicationId) {
        return Array.from(this.certificateRecords.values()).find(c => c.applicationId === applicationId);
    }
    addMaterialRecord(record) {
        const id = this.generateId();
        const newRecord = { ...record, id };
        this.materialRecords.set(id, newRecord);
        return newRecord;
    }
    getMaterialRecordsByApplicationId(applicationId) {
        return Array.from(this.materialRecords.values()).filter(m => true);
    }
    addSupplementNotice(notice) {
        const id = this.generateId();
        const newNotice = { ...notice, id };
        this.supplementNotices.set(id, newNotice);
        return newNotice;
    }
    updateSupplementNotice(id, updates) {
        const notice = this.supplementNotices.get(id);
        if (!notice)
            return undefined;
        const updated = { ...notice, ...updates };
        this.supplementNotices.set(id, updated);
        return updated;
    }
    getSupplementNoticesByApplicationId(applicationId) {
        return Array.from(this.supplementNotices.values())
            .filter(s => s.applicationId === applicationId)
            .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
    }
    clear() {
        this.users.clear();
        this.applications.clear();
        this.operationLogs.clear();
        this.paymentRecords.clear();
        this.certificateRecords.clear();
        this.materialRecords.clear();
        this.supplementNotices.clear();
    }
}
exports.db = new Database();
//# sourceMappingURL=index.js.map