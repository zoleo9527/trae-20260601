import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CourseProject } from './course-project.entity';

export enum StudentStatus {
  ENROLLED = 'enrolled',
  ATTENDED = 'attended',
  ABSENT = 'absent',
  COMPLETED = 'completed',
}

@Entity('student')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_project_id' })
  courseProjectId: string;

  @ManyToOne(() => CourseProject, (project) => project.students)
  @JoinColumn({ name: 'course_project_id' })
  courseProject: CourseProject;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: StudentStatus,
    default: StudentStatus.ENROLLED,
  })
  status: StudentStatus;

  @Column({ type: 'datetime', name: 'enrolled_at', default: () => 'CURRENT_TIMESTAMP' })
  enrolledAt: Date;

  @Column({ type: 'datetime', name: 'attended_at', nullable: true })
  attendedAt: Date;

  @Column({ type: 'text', name: 'absent_reason', nullable: true })
  absentReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}