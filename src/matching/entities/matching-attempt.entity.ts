import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { MatchingStatus, MatchingFailReason, Role } from '../../common/enums';

@Entity('matching_attempts')
@Index('idx_attempts_intake_round', ['intakeId', 'round'])
@Index('idx_attempts_status', ['status'])
@Index('idx_attempts_housekeeper', ['housekeeperId'])
export class MatchingAttempt extends BaseEntity {
  @Column({ type: 'uuid' })
  intakeId: string;
  @Column({ type: 'uuid' })
  housekeeperId: string;

  @Column({ type: 'int', default: 1 })
  round: number;

  @Column({ type: 'int', nullable: true })
  rank?: number;

  @Column({ type: 'simple-enum', enum: MatchingStatus, default: MatchingStatus.PENDING })
  status: MatchingStatus;

  @Column({ type: 'int', nullable: true })
  score?: number;

  @Column({ type: 'simple-enum', enum: MatchingFailReason, default: MatchingFailReason.NONE })
  failReason: MatchingFailReason;

  @Column({ type: 'text', nullable: true })
  failDetails?: string;

  @Column({ type: 'datetime', nullable: true })
  recommendedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  customerRejectedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  housekeeperRejectedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  acceptedAt?: Date;

  @Column({ type: 'simple-enum', enum: Role, nullable: true })
  actorRole?: Role;

  @Column({ type: 'varchar', length: 100, nullable: true })
  actorId?: string;

  @Column({ type: 'text', nullable: true })
  rejectionNotes?: string;
}
