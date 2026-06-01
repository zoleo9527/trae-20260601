import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Attendance } from './Attendance';
import { Student } from './Student';

@Entity()
export class MakeupRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected' | 'completed';

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'datetime', nullable: true })
  preferredDate: Date;

  @Column({ type: 'text', nullable: true })
  adminRemark: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'datetime', nullable: true })
  approvedAt: Date;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @ManyToOne(() => Student)
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(() => Attendance)
  originalAttendance: Attendance;

  @Column()
  originalAttendanceId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
