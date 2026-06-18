import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from '../entities/audit-log.entity';
import { Role } from '../../common/enums';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  async quickLog(
    entityType: string,
    entityId: string,
    action: AuditAction | string,
    details?: string,
    actor?: { role: Role; id: string; name: string },
  ) {
    const entry = this.auditLogRepo.create({
      entityType,
      entityId,
      action: action as AuditAction,
      actorRole: actor?.role,
      actorId: actor?.id,
      actorName: actor?.name,
      remark: details,
    });
    const saved = await this.auditLogRepo.save(entry);
    console.log('[AUDIT]', JSON.stringify({
      entityType,
      entityId,
      action,
      details: details || '',
      actorRole: actor?.role || '',
      actorId: actor?.id || '',
      actorName: actor?.name || '',
      timestamp: saved.createdAt?.toISOString() || new Date().toISOString(),
    }));
    return saved;
  }

  async logStatusChange(
    entityType: string,
    entityId: string,
    fieldName: string,
    oldValue: string,
    newValue: string,
    actor: { role: Role; id: string; name: string },
    remark?: string,
  ) {
    const entry = this.auditLogRepo.create({
      entityType,
      entityId,
      action: AuditAction.STATUS_CHANGE,
      fieldName,
      oldValue,
      newValue,
      actorRole: actor.role,
      actorId: actor.id,
      actorName: actor.name,
      remark,
    });
    return this.auditLogRepo.save(entry);
  }

  async getTrail(entityType: string, entityId: string) {
    return this.auditLogRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async getTrailByActor(actorRole: Role, actorId?: string) {
    const where: any = { actorRole };
    if (actorId) where.actorId = actorId;
    return this.auditLogRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
