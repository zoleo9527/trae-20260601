import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OperationLog } from '../entities/operation-log.entity';
import { User } from '../../auth/entities/user.entity';

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly logRepo: Repository<OperationLog>,
  ) {}

  async record(
    entityType: string,
    entityId: string,
    action: string,
    operator?: User,
    oldValue?: any,
    newValue?: any,
    metadata?: Record<string, any>,
  ) {
    const log = this.logRepo.create({
      entityType,
      entityId,
      action,
      operator,
      oldValue: oldValue !== undefined ? JSON.stringify(oldValue) : null,
      newValue: newValue !== undefined ? JSON.stringify(newValue) : null,
      metadata,
    });
    await this.logRepo.save(log);
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    page = 1,
    pageSize = 20,
  ) {
    const [items, total] = await this.logRepo.findAndCount({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip: (page - 1) * pageSize,
    });
    return { items, total, page, pageSize };
  }
}
