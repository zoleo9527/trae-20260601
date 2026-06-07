import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OperationLog } from '../entities/operation-log.entity';
import { OperationType, MilkChangeStatus } from '../common/enums';

@Injectable()
export class OperationLogService {
  constructor(
    @InjectRepository(OperationLog)
    private readonly logRepository: Repository<OperationLog>,
  ) {}

  async createLog(
    milkChangeId: string,
    operationType: OperationType,
    operatorId?: string,
    operatorName?: string,
    fromStatus?: MilkChangeStatus,
    toStatus?: MilkChangeStatus,
    remark?: string,
  ): Promise<OperationLog> {
    const log = this.logRepository.create({
      milkChangeId,
      operationType,
      operatorId,
      operatorName,
      fromStatus,
      toStatus,
      remark,
    });
    return await this.logRepository.save(log);
  }

  async getLogsByMilkChangeId(milkChangeId: string): Promise<any[]> {
    const logs = await this.logRepository.find({
      where: { milkChangeId },
      order: { createdAt: 'DESC' },
    });
    return logs.map(log => ({
      id: log.id,
      operationType: log.operationType,
      operatorId: log.operatorId,
      operatorName: log.operatorName,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      remark: log.remark,
      createdAt: log.createdAt,
    }));
  }
}
