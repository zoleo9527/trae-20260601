import { NearExpiryAlert } from './near-expiry-alert.entity';
export declare class MedicineInventory {
    id: string;
    medicineCode: string;
    medicineName: string;
    specification: string;
    manufacturer: string;
    batchNo: string;
    expiryDate: Date;
    quantity: number;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    storeId: string;
    storeName: string;
    location: string;
    lastCountTime?: Date;
    createdAt: Date;
    updatedAt: Date;
    alerts: NearExpiryAlert[];
}
