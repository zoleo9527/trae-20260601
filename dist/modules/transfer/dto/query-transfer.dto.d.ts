import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { TransferStatus, TransferType, TransferPriority } from '../enums';
export declare class QueryTransferDto extends PaginationQueryDto {
    currentStatus?: TransferStatus;
    transferType?: TransferType;
    priority?: TransferPriority;
    fromStoreId?: string;
    toStoreId?: string;
    startTime?: string;
    endTime?: string;
}
