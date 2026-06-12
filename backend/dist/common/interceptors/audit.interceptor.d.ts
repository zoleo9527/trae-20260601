import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare const AUDIT_LOG_TOKEN = "AUDIT_LOG_TOKEN";
export interface AuditLogEntry {
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    entity: string;
    entityId: string;
    before: any;
    after: any;
    timestamp: Date;
}
export interface AuditService {
    log(entry: AuditLogEntry): void;
}
export declare class AuditInterceptor implements NestInterceptor {
    private auditService;
    constructor(auditService: AuditService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}
