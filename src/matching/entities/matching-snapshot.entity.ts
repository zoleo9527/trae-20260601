import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('matching_snapshots')
@Index('idx_snapshot_intake_round', ['intakeId', 'round'], { unique: true })
export class MatchingSnapshot extends BaseEntity {
  @Column({ type: 'uuid' })
  intakeId: string;

  @Column({ type: 'int' })
  round: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  generatedAt: Date;

  @Column({ type: 'varchar', length: 100 })
  generatedBy: string;

  @Column({ type: 'int' })
  totalCandidates: number;

  @Column({ type: 'int' })
  shortlistedCandidates: number;

  @Column({ type: 'text' })
  snapshotJson: string;
}
