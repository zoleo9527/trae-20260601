import { OffShelfStatus } from '../enums/off-shelf-status.enum';
import { OffShelfReason } from '../enums/off-shelf-reason.enum';
export interface OffShelfItem {
    inventoryId: string;
    medicineName: string;
    batchNo: string;
    expiryDate: string;
    quantity: number;
    unit: string;
}
export interface AuditLog {
    action: string;
    operatorId: string;
    operatorName: string;
    fromStatus: string;
    toStatus: string;
    timestamp: Date;
    remark?: string;
}
export declare class OffShelfOrder {
    id: string;
    orderNo: string;
    reason: OffShelfReason;
    reasonDetail: string;
    items: OffShelfItem[];
    totalQuantity: number;
    currentStatus: OffShelfStatus;
    submitterId: string;
    submitterName: string;
    submitTime: Date;
    reviewerId: string;
    reviewerName: string;
    reviewTime: Date;
    reviewRemark: string;
    rejectReason: string;
    storeId: string;
    storeName: string;
    auditLogs: AuditLog[];
    createdAt: Date;
    updatedAt: Date;
}
