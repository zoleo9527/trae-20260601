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
import { TrainingNeedRemark } from './training-need-remark.entity';

export enum TrainingNeedStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  TRANSFERRED = 'transferred',
}

export enum Urgency {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('training_need')
export class TrainingNeed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  department: string;

  @Column({ name: 'submitter_id' })
  submitterId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'submitter_id' })
  submitter: User;

  @Column({ name: 'current_handler_id', nullable: true })
  currentHandlerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'current_handler_id' })
  currentHandler: User;

  @Column({ type: 'date', name: 'expected_date' })
  expectedDate: Date;

  @Column({ name: 'participant_count', default: 0 })
  participantCount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budget: number;

  @Column({
    type: 'enum',
    enum: Urgency,
    default: Urgency.MEDIUM,
  })
  urgency: Urgency;

  @Column({
    type: 'enum',
    enum: TrainingNeedStatus,
    default: TrainingNeedStatus.PENDING,
  })
  status: TrainingNeedStatus;

  @Column({ type: 'text', nullable: true })
  attachments: string;

  @OneToMany(() => TrainingNeedRemark, (remark) => remark.trainingNeed)
  remarks: TrainingNeedRemark[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}