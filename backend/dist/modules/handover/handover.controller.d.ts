import { HandoverService } from './handover.service';
export declare class HandoverController {
    private readonly handoverService;
    constructor(handoverService: HandoverService);
    submit(body: {
        propertyId: string;
        checklist?: any[];
        issues?: string[];
    }, user: any): import("./handover.service").Handover;
    getDisputes(): import("./handover.service").Handover[];
    findAll(query: {
        propertyId?: string;
        status?: string;
        submittedBy?: string;
    }): import("./handover.service").Handover[];
    findOne(id: string): import("./handover.service").Handover;
    getAuditTrail(id: string): import("../audit/audit.service").AuditLogEntry[];
    confirm(id: string, user: any): import("./handover.service").Handover;
    dispute(id: string, body: {
        reason: string;
        disputedItems: string[];
    }, user: any): import("./handover.service").Handover;
    resolve(id: string, body: {
        resolution: string;
    }, user: any): import("./handover.service").Handover;
}
