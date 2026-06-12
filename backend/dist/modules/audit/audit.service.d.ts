export interface AuditLogEntry {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    entity: string;
    entityId: string;
    before: any;
    after: any;
    timestamp: Date;
    ip?: string;
}
export interface AuditQueryFilters {
    userId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    from?: string;
    to?: string;
}
export interface CreateAuditEntry {
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    entity: string;
    entityId: string;
    before?: any;
    after?: any;
    ip?: string;
}
export declare class AuditService {
    private readonly entries;
    log(entry: CreateAuditEntry): AuditLogEntry;
    query(filters?: AuditQueryFilters): AuditLogEntry[];
    getByEntity(entity: string, entityId: string): AuditLogEntry[];
    getRecent(limit?: number): AuditLogEntry[];
    getDisputesOverview(handoverDisputes: any[], depositDisputes: any[], pendingKeyTransfers: any[]): any;
}
