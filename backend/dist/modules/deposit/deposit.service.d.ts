import { AuditService } from '../audit/audit.service';
import { PropertyService } from '../property/property.service';
export interface DeductionItem {
    item: string;
    amount: number;
}
export interface DepositDispute {
    disputeReason: string;
    disputedAmount: number;
    deductionItems: DeductionItem[];
    raisedAt: Date;
    raisedBy: string;
    raisedByName: string;
}
export interface DepositResolution {
    finalAmount: number;
    resolutionNotes: string;
    resolvedAt: Date;
    resolvedBy: string;
    resolvedByName: string;
}
export interface Deposit {
    id: string;
    propertyId: string;
    handoverId?: string;
    tenantName: string;
    originalDeposit: number;
    deductions: DeductionItem[];
    totalDeductions: number;
    refundAmount: number;
    status: 'pending' | 'confirmed' | 'disputed' | 'settled';
    initiatedBy: string;
    initiatedByName: string;
    initiatedAt: Date;
    confirmedBy?: string;
    confirmedByName?: string;
    confirmedAt?: Date;
    dispute?: DepositDispute;
    resolution?: DepositResolution;
    settledAt?: Date;
    settledBy?: string;
    settledByName?: string;
}
export interface CreateDepositData {
    propertyId: string;
    handoverId?: string;
    tenantName: string;
    originalDeposit: number;
    deductions: DeductionItem[];
}
export interface DepositFilters {
    propertyId?: string;
    status?: string;
}
export declare class DepositService {
    private readonly auditService;
    private readonly propertyService;
    private readonly deposits;
    constructor(auditService: AuditService, propertyService: PropertyService);
    initiate(data: CreateDepositData, userId: string, userName: string, userRole: string): Deposit;
    confirm(id: string, userId: string, userName: string, userRole: string): Deposit;
    dispute(id: string, data: {
        disputeReason: string;
        disputedAmount: number;
        deductionItems: DeductionItem[];
    }, userId: string, userName: string, userRole: string): Deposit;
    resolve(id: string, resolution: {
        finalAmount: number;
        resolutionNotes: string;
    }, userId: string, userName: string, userRole: string): Deposit;
    markSettled(id: string, userId: string, userName: string, userRole: string): Deposit;
    findAll(filters?: DepositFilters): Deposit[];
    findOne(id: string): Deposit;
    getDisputes(): Deposit[];
}
