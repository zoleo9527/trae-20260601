import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { QueryAuditLogDto, CreateAuditLogDto } from './audit-log.dto';
import { PaginatedResult } from '@/common/dto/pagination.dto';
export declare class AuditLogService {
    private readonly auditLogRepository;
    static instance: AuditLogService;
    constructor(auditLogRepository: Repository<AuditLog>);
    log(dto: CreateAuditLogDto): Promise<AuditLog>;
    query(dto: QueryAuditLogDto): Promise<PaginatedResult<AuditLog>>;
    findById(id: string): Promise<AuditLog>;
}
