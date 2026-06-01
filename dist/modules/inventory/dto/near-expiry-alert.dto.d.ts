import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { AlertLevel, AlertStatus } from '../entities/near-expiry-alert.entity';
export declare class NearExpiryAlertQueryDto extends PaginationQueryDto {
    alertLevel?: AlertLevel;
    status?: AlertStatus;
    minDaysToExpiry?: number;
    maxDaysToExpiry?: number;
    storeId?: string;
}
export declare class AcknowledgeAlertDto {
    remark?: string;
}
export declare class ResolveAlertDto {
    remark?: string;
}
export declare class NearExpiryMedicineQueryDto {
    daysToExpiry?: number;
}
