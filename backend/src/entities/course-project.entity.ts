import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TrainingNeed } from './training-need.entity';
import { Student } from './student.entity';

export enum CourseProjectStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  ENROLLING = 'enrolling',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('course_project')
export class CourseProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'training_need_id' })
  trainingNeedId: string;

  @ManyToOne(() => TrainingNeed)
  @JoinColumn({ name: 'training_need_id' })
  trainingNeed: TrainingNeed;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  objectives: string;

  @Column({ type: 'text', nullable: true })
  outline: string;

  @Column({ name: 'instructor_id' })
  instructorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'instructor_id' })
  instructor: User;

  @Column({ type: 'datetime', name: 'start_time' })
  startTime: Date;

  @Column({ type: 'datetime', name: 'end_time' })
  endTime: Date;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'datetime', name: 'enrollment_deadline', nullable: true })
  enrollmentDeadline: Date;

  @Column({ name: 'max_participants', default: 0 })
  maxParticipants: number;

  @Column({
    type: 'enum',
    enum: CourseProjectStatus,
    default: CourseProjectStatus.PENDING,
  })
  status: CourseProjectStatus;

  @OneToMany(() => Student, (student) => student.courseProject)
  students: Student[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}