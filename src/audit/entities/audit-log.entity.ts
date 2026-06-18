import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../common/enums/role.enum';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  ASSIGN = 'ASSIGN',
  REJECT = 'REJECT',
  ACCEPT = 'ACCEPT',
  CANCEL = 'CANCEL',
  CLARIFY = 'CLARIFY',
  MATCH = 'MATCH',
  COMMENT = 'COMMENT',
  ESCALATE = 'ESCALATE',
  RESOLVE = 'RESOLVE',
  SEED = 'SEED',
  REPORT_NO_SHOW = 'REPORT_NO_SHOW',
  HANDLE_NO_SHOW = 'HANDLE_NO_SHOW',
  FOLLOW_UP = 'FOLLOW_UP',
  CLOSE_WITHOUT_RESOLUTION = 'CLOSE_WITHOUT_RESOLUTION',
  START_MATCHING = 'START_MATCHING',
  UPDATE_BLOCK_REASON = 'UPDATE_BLOCK_REASON',
  RECOMMEND = 'RECOMMEND',
  CUSTOMER_ACCEPT = 'CUSTOMER_ACCEPT',
  CUSTOMER_REJECT = 'CUSTOMER_REJECT',
  HOUSEKEEPER_ACCEPT = 'HOUSEKEEPER_ACCEPT',
  HOUSEKEEPER_REJECT = 'HOUSEKEEPER_REJECT',
  MATCH_ROUND = 'MATCH_ROUND',
  COMPLETE = 'COMPLETE',
}

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['actorRole', 'actorId'])
export class AuditLog extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  entityType: string;

  @Column({ type: 'uuid' })
  entityId: string;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column({ type: 'simple-enum', enum: Role, nullable: true })
  actorRole?: Role;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actorId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actorName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fieldName?: string;

  @Column({ type: 'text', nullable: true })
  oldValue?: string;

  @Column({ type: 'text', nullable: true })
  newValue?: string;

  @Column({ type: 'text', nullable: true })
  remark?: string;
}
