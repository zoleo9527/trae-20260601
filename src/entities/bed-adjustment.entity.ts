import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Bed } from './bed.entity';
import { Staff } from './staff.entity';
import { AdjustmentStatus, AdjustmentReason } from '../common/enums';

@Entity('bed_adjustment')
export class BedAdjustment {
  @PrimaryColumn()
  id: string;

  @Column()
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  sourceBedId: string;

  @ManyToOne(() => Bed)
  @JoinColumn({ name: 'sourceBedId' })
  sourceBed: Bed;

  @Column()
  targetBedId: string;

  @ManyToOne(() => Bed)
  @JoinColumn({ name: 'targetBedId' })
  targetBed: Bed;

  @Column({
    type: 'text',
    transformer: {
      to: (value: AdjustmentStatus) => value,
      from: (value: string) => value as AdjustmentStatus,
    },
    default: AdjustmentStatus.PENDING,
  })
  status: AdjustmentStatus;

  @Column({
    type: 'text',
    transformer: {
      to: (value: AdjustmentReason) => value,
      from: (value: string) => value as AdjustmentReason,
    },
  })
  reason: AdjustmentReason;

  @Column({ type: 'text', nullable: true })
  reasonDetail: string;

  @Column({ nullable: true })
  currentHandlerId: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'currentHandlerId' })
  currentHandler: Staff;

  @Column({ nullable: true })
  assignedToId: string;

  @ManyToOne(() => Staff, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: Staff;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ type: 'text', nullable: true })
  returnReason: string;

  @Column({ type: 'datetime', nullable: true })
  expectedCompleteAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
