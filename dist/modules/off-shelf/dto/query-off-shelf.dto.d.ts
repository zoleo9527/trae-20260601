import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { OffShelfStatus } from '../enums/off-shelf-status.enum';
import { OffShelfReason } from '../enums/off-shelf-reason.enum';
export declare class QueryOffShelfDto extends PaginationQueryDto {
    currentStatus?: OffShelfStatus;
    reason?: OffShelfReason;
    storeId?: string;
    startTime?: string;
    endTime?: string;
}
