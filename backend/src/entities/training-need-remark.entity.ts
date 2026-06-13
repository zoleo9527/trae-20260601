import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { TrainingNeed } from './training-need.entity';

export enum RemarkAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  TRANSFER = 'transfer',
  COMMENT = 'comment',
}

@Entity('training_need_remark')
export class TrainingNeedRemark {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'training_need_id' })
  trainingNeedId: string;

  @ManyToOne(() => TrainingNeed, (need) => need.remarks)
  @JoinColumn({ name: 'training_need_id' })
  trainingNeed: TrainingNeed;

  @Column({ name: 'handler_id' })
  handlerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'handler_id' })
  handler: User;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: RemarkAction,
  })
  action: RemarkAction;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}