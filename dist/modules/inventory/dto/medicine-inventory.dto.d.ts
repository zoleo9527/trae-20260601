import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class CreateMedicineInventoryDto {
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
}
export declare class UpdateMedicineInventoryDto {
    medicineName?: string;
    specification?: string;
    manufacturer?: string;
    expiryDate?: Date;
    quantity?: number;
    unit?: string;
    purchasePrice?: number;
    sellingPrice?: number;
    storeName?: string;
    location?: string;
    lastCountTime?: Date;
}
export declare class MedicineInventoryQueryDto extends PaginationQueryDto {
    medicineName?: string;
    batchNo?: string;
    expiryDateStart?: Date;
    expiryDateEnd?: Date;
    storeId?: string;
}
