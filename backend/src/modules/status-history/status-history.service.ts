import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StatusChangeHistory, EntityType } from '../../entities/status-change-history.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class StatusChangeHistoryService {
  constructor(
    @InjectRepository(StatusChangeHistory)
    private historyRepository: Repository<StatusChangeHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async recordStatusChange(
    entityType: EntityType,
    entityId: string,
    fromStatus: string,
    toStatus: string,
    changedById: string,
    reason?: string,
    remarks?: string,
  ): Promise<StatusChangeHistory> {
    const history = this.historyRepository.create({
      entityType,
      entityId,
      fromStatus,
      toStatus,
      changedById,
      reason,
      remarks,
    });

    return await this.historyRepository.save(history);
  }

  async getHistoryByEntity(
    entityType: EntityType,
    entityId: string,
  ): Promise<any[]> {
    const histories = await this.historyRepository.find({
      where: { entityType, entityId },
      relations: ['changedBy'],
      order: { createdAt: 'ASC' },
    });

    return histories.map((history) => ({
      id: history.id,
      entityType: history.entityType,
      entityId: history.entityId,
      fromStatus: history.fromStatus,
      toStatus: history.toStatus,
      changedBy: {
        id: history.changedBy.id,
        name: history.changedBy.name,
        role: history.changedBy.role,
      },
      reason: history.reason,
      remarks: history.remarks,
      createdAt: history.createdAt,
    }));
  }

  async getLatestStatusChange(
    entityType: EntityType,
    entityId: string,
  ): Promise<StatusChangeHistory | null> {
    return await this.historyRepository.findOne({
      where: { entityType, entityId },
      relations: ['changedBy'],
      order: { createdAt: 'DESC' },
    });
  }
}