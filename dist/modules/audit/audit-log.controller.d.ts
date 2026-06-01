import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './audit-log.dto';
import { AuditLog } from './audit-log.entity';
import { PaginatedResult } from '@/common/dto/pagination.dto';
import { RequestContext } from '@/common/decorators/request-context.decorator';
import { ApiResponse as ApiResponseDto } from '@/common/dto/response.dto';
export declare class AuditLogController {
    private readonly auditLogService;
    constructor(auditLogService: AuditLogService);
    query(dto: QueryAuditLogDto, ctx: RequestContext): Promise<ApiResponseDto<PaginatedResult<AuditLog>>>;
    findById(id: string, ctx: RequestContext): Promise<ApiResponseDto<AuditLog>>;
}
