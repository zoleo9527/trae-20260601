import { MedicineInventory } from './medicine-inventory.entity';
export declare enum AlertLevel {
    HIGH = "HIGH",
    MEDIUM = "MEDIUM",
    LOW = "LOW"
}
export declare enum AlertStatus {
    ACTIVE = "ACTIVE",
    ACKNOWLEDGED = "ACKNOWLEDGED",
    RESOLVED = "RESOLVED"
}
export declare enum AlertAction {
    ACKNOWLEDGE = "ACKNOWLEDGE",
    RESOLVE = "RESOLVE"
}
export declare class NearExpiryAlert {
    id: string;
    inventoryId: string;
    medicineCode: string;
    medicineName: string;
    batchNo: string;
    expiryDate: Date;
    currentQuantity: number;
    daysToExpiry: number;
    alertLevel: AlertLevel;
    status: AlertStatus;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    acknowledgedRemark?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
    resolvedRemark?: string;
    storeId: string;
    storeName: string;
    createdAt: Date;
    updatedAt: Date;
    inventory: MedicineInventory;
}
