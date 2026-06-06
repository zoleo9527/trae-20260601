import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from './student.entity';
import { Bed } from './bed.entity';
import { Staff } from './staff.entity';
import { CheckInStatus } from '../common/enums';

@Entity('check_in_assignment')
export class CheckInAssignment {
  @PrimaryColumn()
  id: string;

  @Column()
  studentId: string;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'studentId' })
  student: Student;

  @Column()
  bedId: string;

  @ManyToOne(() => Bed)
  @JoinColumn({ name: 'bedId' })
  bed: Bed;

  @Column({
    type: 'text',
    transformer: {
      to: (value: CheckInStatus) => value,
      from: (value: string) => value as CheckInStatus,
    },
    default: CheckInStatus.PENDING,
  })
  status: CheckInStatus;

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
