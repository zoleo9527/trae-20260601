import { AuditService } from '../audit/audit.service';
import { PropertyService } from '../property/property.service';
export interface ChecklistItem {
    item: string;
    status: 'pass' | 'fail' | 'na';
    notes?: string;
}
export interface HandoverDispute {
    reason: string;
    disputedItems: string[];
    raisedAt: Date;
    raisedBy: string;
    raisedByName: string;
}
export interface Handover {
    id: string;
    propertyId: string;
    submittedBy: string;
    submittedByName: string;
    submittedAt: Date;
    checklist: ChecklistItem[];
    issues: string[];
    status: 'pending' | 'confirmed' | 'disputed' | 'resolved';
    confirmedBy?: string;
    confirmedByName?: string;
    confirmedAt?: Date;
    dispute?: HandoverDispute;
    resolution?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
    resolvedByName?: string;
}
export interface HandoverFilters {
    propertyId?: string;
    status?: string;
    submittedBy?: string;
}
export declare class HandoverService {
    private readonly auditService;
    private readonly propertyService;
    private handovers;
    constructor(auditService: AuditService, propertyService: PropertyService);
    submit(data: {
        propertyId: string;
        checklist?: ChecklistItem[];
        issues?: string[];
    }, userId: string, userName: string, userRole: string): Handover;
    confirm(id: string, userId: string, userName: string, userRole: string): Handover;
    dispute(id: string, data: {
        reason: string;
        disputedItems: string[];
    }, userId: string, userName: string, userRole: string): Handover;
    resolve(id: string, resolution: string, userId: string, userName: string, userRole: string): Handover;
    findAll(filters?: HandoverFilters): Handover[];
    findOne(id: string): Handover;
    getDisputes(): Handover[];
    getAuditTrail(id: string): import("../audit/audit.service").AuditLogEntry[];
}
