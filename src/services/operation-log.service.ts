import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { OperationLog } from '../entities/operation-log.entity';
import { OperationType, StaffRoleLabel } from '../common/enums';

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly operationLogRepository: Repository<OperationLog>,
  ) {}

  async createLog(
    businessType: string,
    businessId: string,
    operationType: OperationType,
    operatorId: string,
    operatorName: string,
    operatorRole: string,
    content: string,
    fromStatus?: string,
    toStatus?: string,
  ): Promise<OperationLog> {
    const log = this.operationLogRepository.create({
      id: uuidv4(),
      businessType,
      businessId,
      operationType,
      operatorId,
      content: `[${StaffRoleLabel[operatorRole] || operatorRole}] ${operatorName}: ${content}`,
      fromStatus,
      toStatus,
    });
    return this.operationLogRepository.save(log);
  }

  async getLogsByBusiness(businessType: string, businessId: string): Promise<OperationLog[]> {
    return this.operationLogRepository.find({
      where: { businessType, businessId },
      relations: ['operator'],
      order: { createdAt: 'ASC' },
    });
  }
}
