import { AuditService } from '../audit/audit.service';
import { HandoverService } from '../handover/handover.service';
import { PropertyService } from '../property/property.service';
export interface KeyTransfer {
    id: string;
    propertyId: string;
    handoverId: string;
    keyCount: number;
    keyTypes: string[];
    transferredBy: string;
    transferredByName: string;
    transferredAt: Date;
    receivedBy?: string;
    receivedByName?: string;
    receivedAt?: Date;
    returnedAt?: Date;
    returnedBy?: string;
    returnedByName?: string;
    returnNotes?: string;
    status: 'pending_transfer' | 'transferred' | 'returned';
}
export interface KeyTransferFilters {
    propertyId?: string;
    handoverId?: string;
    status?: string;
}
export declare class KeyTransferService {
    private readonly auditService;
    private readonly handoverService;
    private readonly propertyService;
    private readonly transfers;
    constructor(auditService: AuditService, handoverService: HandoverService, propertyService: PropertyService);
    initiateTransfer(data: {
        propertyId: string;
        handoverId: string;
        keyCount: number;
        keyTypes: string[];
    }, userId: string, userName: string, userRole: string): KeyTransfer;
    confirmReception(id: string, userId: string, userName: string, userRole: string): KeyTransfer;
    returnKeys(id: string, data: {
        returnNotes?: string;
    }, userId: string, userName: string, userRole: string): KeyTransfer;
    findAll(filters?: KeyTransferFilters): KeyTransfer[];
    findOne(id: string): KeyTransfer;
    getTransferHistory(id: string): import("../audit/audit.service").AuditLogEntry[];
    getTransferTimeline(id: string): {
        transferId: string;
        propertyId: string;
        handoverId: string;
        currentStatus: "pending_transfer" | "transferred" | "returned";
        keyCount: number;
        keyTypes: string[];
        timeline: any[];
        transferredBy: string;
        transferredAt: Date;
        receivedBy: string | undefined;
        receivedAt: Date | undefined;
        returnedBy: string | undefined;
        returnedAt: Date | undefined;
    };
    getByHandover(handoverId: string): KeyTransfer;
    private _mapActionToEvent;
}
