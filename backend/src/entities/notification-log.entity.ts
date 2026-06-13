import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Notification } from './notification.entity';

@Entity('notification_log')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'notification_id' })
  notificationId: string;

  @ManyToOne(() => Notification)
  @JoinColumn({ name: 'notification_id' })
  notification: Notification;

  @Column({ type: 'datetime', name: 'trigger_time', default: () => 'CURRENT_TIMESTAMP' })
  triggerTime: Date;

  @Column({ name: 'trigger_result' })
  triggerResult: string;

  @Column({ type: 'text', name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ name: 'log_file_path', nullable: true })
  logFilePath: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}