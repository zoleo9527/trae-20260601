import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { QueryAuditLogDto, CreateAuditLogDto } from './audit-log.dto';
import {
  PaginatedResult,
  createPaginatedResult,
} from '@/common/dto/pagination.dto';

@Injectable()
export class AuditLogService {
  static instance: AuditLogService;

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {
    AuditLogService.instance = this;
  }

  async log(dto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      module: dto.module,
      action: dto.action,
      entityId: dto.entityId,
      beforeState: dto.beforeState,
      afterState: dto.afterState,
      remark: dto.remark,
      operatorId: dto.operatorId,
      operatorName: dto.operatorName,
      operatorRole: dto.operatorRole,
      storeId: dto.storeId,
      storeName: dto.storeName,
      requestId: dto.requestId,
      success: dto.success ?? true,
      requestData: dto.requestData,
      responseData: dto.responseData,
    });
    return this.auditLogRepository.save(auditLog);
  }

  async query(dto: QueryAuditLogDto): Promise<PaginatedResult<AuditLog>> {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      module,
      action,
      operatorId,
      storeId,
      startTime,
      endTime,
    } = dto;

    const where: any = {};

    if (module) {
      where.module = module;
    }
    if (action) {
      where.action = action;
    }
    if (operatorId) {
      where.operatorId = operatorId;
    }
    if (storeId) {
      where.storeId = storeId;
    }
    if (startTime && endTime) {
      where.createdAt = Between(new Date(startTime), new Date(endTime));
    } else if (startTime) {
      where.createdAt = Between(new Date(startTime), new Date());
    } else if (endTime) {
      where.createdAt = Between(new Date('1970-01-01'), new Date(endTime));
    }

    const [items, total] = await this.auditLogRepository.findAndCount({
      where,
      order: {
        [sortBy]: sortOrder as 'ASC' | 'DESC',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findById(id: string): Promise<AuditLog> {
    const auditLog = await this.auditLogRepository.findOne({
      where: { id },
    });
    if (!auditLog) {
      throw new NotFoundException('审计日志不存在');
    }
    return auditLog;
  }
}
