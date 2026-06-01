import { PaginationQueryDto } from '@/common/dto/pagination.dto';
export declare class QueryAuditLogDto extends PaginationQueryDto {
    module?: string;
    action?: string;
    operatorId?: string;
    storeId?: string;
    startTime?: string;
    endTime?: string;
}
export interface CreateAuditLogDto {
    module: string;
    action: string;
    entityId?: string;
    beforeState?: Record<string, any>;
    afterState?: Record<string, any>;
    remark?: string;
    operatorId?: string;
    operatorName?: string;
    operatorRole?: string;
    storeId?: string;
    storeName?: string;
    requestId?: string;
    success?: boolean;
    requestData?: Record<string, any>;
    responseData?: Record<string, any>;
}
