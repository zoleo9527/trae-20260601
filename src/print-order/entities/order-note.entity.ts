import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PrintOrder } from './print-order.entity';
import { User } from '../../auth/entities/user.entity';

export enum NoteType {
  GENERAL = 'general',
  REJECT_REASON = 'reject_reason',
  SUPPLEMENT = 'supplement',
  DESIGN = 'design',
  INSTALL = 'install',
}

@Entity('order_notes')
export class OrderNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PrintOrder, (order) => order.notes)
  @JoinColumn({ name: 'orderId' })
  @Index()
  order: PrintOrder;

  @Column({
    type: 'simple-enum',
    enum: NoteType,
    default: NoteType.GENERAL,
  })
  noteType: NoteType;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'simple-json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
