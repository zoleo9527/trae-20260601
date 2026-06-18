import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../common/entities/base.entity';
import { ReviewStatus } from '../common/enums/review-status.enum';
import { Role } from '../common/enums/role.enum';

@Entity('reviews')
export class Review extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'varchar', length: 100 })
  customerName: string;

  @Column({ type: 'uuid' })
  housekeeperId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  content: string;

  @Index()
  @Column({ type: 'simple-enum', enum: ReviewStatus, default: ReviewStatus.SUBMITTED })
  status: ReviewStatus;

  @Index()
  @Column({ type: 'simple-enum', enum: Role, nullable: true })
  assignedRole?: Role;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedName?: string;

  @Index()
  @Column({ type: 'simple-enum', enum: Role, nullable: true })
  ownerRole?: Role;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ownerId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ownerName?: string;

  @Column({ type: 'text', nullable: true })
  followUpNotes?: string;

  @Column({ type: 'text', nullable: true })
  resolution?: string;

  @Column({ type: 'datetime', nullable: true })
  escalatedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'datetime', nullable: true })
  closedAt?: Date;
}
