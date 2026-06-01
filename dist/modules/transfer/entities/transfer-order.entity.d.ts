import { TransferStatus, TransferType, TransferPriority, TransferAction } from '../enums';
export interface TransferItem {
    medicineCode: string;
    medicineName: string;
    batchNo: string;
    expiryDate: string;
    quantity: number;
    unit: string;
    sellingPrice: number;
    subtotal: number;
    inventoryId?: string;
}
export interface AuditLogEntry {
    action: TransferAction;
    fromStatus: TransferStatus;
    toStatus: TransferStatus;
    operatorId: string;
    operatorName: string;
    operateTime: Date;
    remark?: string;
    rejectReason?: string;
}
export declare class TransferOrder {
    id: string;
    orderNo: string;
    transferType: TransferType;
    fromStoreId: string;
    fromStoreName: string;
    toStoreId: string;
    toStoreName: string;
    items: TransferItem[];
    totalQuantity: number;
    totalAmount: number;
    currentStatus: TransferStatus;
    priority: TransferPriority;
    expectedDate: string;
    remark: string;
    submitterId: string;
    submitterName: string;
    submitTime: Date;
    approverId: string;
    approverName: string;
    approveTime: Date;
    approveRemark: string;
    rejectReason: string;
    completedBy: string;
    completedAt: Date;
    storeId: string;
    storeName: string;
    auditLogs: AuditLogEntry[];
    createdAt: Date;
    updatedAt: Date;
}
