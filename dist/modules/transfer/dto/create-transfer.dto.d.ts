import { TransferType, TransferPriority } from '../enums';
import { TransferItemDto } from './transfer-item.dto';
export declare class CreateTransferDto {
    transferType: TransferType;
    fromStoreId: string;
    fromStoreName: string;
    toStoreId: string;
    toStoreName: string;
    items: TransferItemDto[];
    priority?: TransferPriority;
    expectedDate?: string;
    remark?: string;
    storeId: string;
    storeName: string;
}
