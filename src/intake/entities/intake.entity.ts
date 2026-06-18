import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { IntakeStatus, IntakeBlockReason, Role } from '../../common/enums';

@Entity('intakes')
export class Intake extends BaseEntity {
  @Column({ type: 'varchar', length: 50, unique: true })
  intakeNo: string;

  @Column({ type: 'varchar', length: 100 })
  customerName: string;

  @Column({ type: 'varchar', length: 20 })
  customerPhone: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  serviceType?: string;

  @Column({ type: 'text', nullable: true })
  serviceScope?: string;

  @Column({ type: 'int', nullable: true })
  salaryBudget?: number;

  @Column({ type: 'datetime', nullable: true })
  startTime?: Date;

  @Column({ type: 'int', nullable: true })
  requiredDaysPerWeek?: number;

  @Column({ type: 'int', nullable: true })
  hoursPerDay?: number;

  @Column({ type: 'text', nullable: true })
  specialRequirements?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @Index()
  @Column({ type: 'simple-enum', enum: IntakeStatus, default: IntakeStatus.CREATED })
  status: IntakeStatus;

  @Index()
  @Column({ type: 'simple-enum', enum: IntakeBlockReason, default: IntakeBlockReason.NONE })
  blockReason: IntakeBlockReason;

  @Column({ type: 'datetime', nullable: true })
  blockedAt?: Date;

  @Column({ type: 'int', default: 0 })
  currentMatchingRound: number;

  @Column({ type: 'uuid', nullable: true })
  assignedHousekeeperId?: string;

  @Index()
  @Column({ type: 'simple-enum', enum: Role, nullable: true })
  ownerRole?: Role;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ownerId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ownerName?: string;
}
