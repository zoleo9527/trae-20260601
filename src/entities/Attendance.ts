import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Session } from './Session';
import { Student } from './Student';

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 'present' })
  status: 'present' | 'absent' | 'late' | 'leave' | 'makeup';

  @Column({ type: 'datetime', nullable: true })
  checkInTime: Date;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ default: false })
  makeupApplied: boolean;

  @Column({ default: false })
  makeupCompleted: boolean;

  @ManyToOne(() => Student)
  student: Student;

  @Column()
  studentId: number;

  @ManyToOne(() => Session)
  session: Session;

  @Column()
  sessionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
