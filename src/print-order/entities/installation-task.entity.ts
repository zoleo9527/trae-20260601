import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PrintOrder } from './print-order.entity';
import { User } from '../../auth/entities/user.entity';

export enum InstallationTaskStatus {
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  PHOTO_SUBMITTED = 'photo_submitted',
  PHOTO_APPROVED = 'photo_approved',
  PHOTO_REJECTED = 'photo_rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskStuckLevel {
  NORMAL = 'normal',
  WARNING = 'warning',
  DANGER = 'danger',
}

@Entity('installation_tasks')
export class InstallationTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PrintOrder, (order) => order.installationTasks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: PrintOrder;

  @Column()
  @Index()
  orderId: string;

  @Column({ default: 1 })
  taskRound: number;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'installLeaderId' })
  installLeader: User;

  @Column({ nullable: true })
  installLeaderId: string;

  @Column({ type: 'datetime', nullable: true })
  installTime: Date;

  @Column({ nullable: true })
  installAddress: string;

  @Column({ type: 'simple-json', nullable: true })
  teamMembers: string[];

  @Column({
    type: 'simple-enum',
    enum: InstallationTaskStatus,
    default: InstallationTaskStatus.ASSIGNED,
  })
  @Index()
  status: InstallationTaskStatus;

  @Column({ type: 'text', nullable: true })
  assignmentNotes: string;

  @Column({ type: 'simple-json', nullable: true })
  photoUrls: string[];

  @Column({ type: 'text', nullable: true })
  returnNotes: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'submittedById' })
  submittedBy: User;

  @Column({ type: 'datetime', nullable: true })
  submittedAt: Date;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'assignedById' })
  assignedBy: User;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ type: 'simple-json', nullable: true })
  supplementNotes: Array<{
    id: string;
    content: string;
    authorName: string;
    authorId: string;
    authorRole: string;
    createdAt: Date;
  }>;

  @Column({ default: false })
  isActive: boolean;

  @Column({
    type: 'simple-enum',
    enum: TaskStuckLevel,
    default: TaskStuckLevel.NORMAL,
  })
  stuckLevel: TaskStuckLevel;

  @Column({ type: 'int', default: 0 })
  stuckMinutes: number;

  @Column({ type: 'text', nullable: true })
  stuckHint: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;
}
