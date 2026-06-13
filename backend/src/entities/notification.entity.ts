import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  TRAINING_NEED_APPROVED = 'training_need_approved',
  TRAINING_NEED_REJECTED = 'training_need_rejected',
  COURSE_PROJECT_APPROVED = 'course_project_approved',
  COURSE_PROJECT_REJECTED = 'course_project_rejected',
  COURSE_REMINDER = 'course_reminder',
  ASSIGNMENT_REMINDER = 'assignment_reminder',
  CERTIFICATE_ISSUED = 'certificate_issued',
}

@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'related_entity_type', nullable: true })
  relatedEntityType: string;

  @Column({ name: 'related_entity_id', nullable: true })
  relatedEntityId: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}