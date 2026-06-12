import { AuditService, AuditQueryFilters } from './audit.service';
export declare class AuditController {
    private readonly auditService;
    constructor(auditService: AuditService);
    query(filters: AuditQueryFilters): import("./audit.service").AuditLogEntry[];
    getRecent(limit: string): import("./audit.service").AuditLogEntry[];
    getByEntity(entity: string, entityId: string): import("./audit.service").AuditLogEntry[];
}
