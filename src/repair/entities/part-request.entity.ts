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
import { IntakeOrder } from '../../intake/entities/intake-order.entity';
import { User } from '../../auth/entities/user.entity';
import { PartRequestStatus } from '../../common/enums/part-request-status.enum';

@Entity('part_requests')
export class PartRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => IntakeOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  @Index()
  order: IntakeOrder;

  @Column()
  orderId: string;

  @Column()
  partName: string;

  @Column({ type: 'simple-json', nullable: true })
  partInfo: {
    partNo?: string;
    brand?: string;
    spec?: string;
    supplier?: string;
  };

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  estimatedCost: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'simple-enum',
    enum: PartRequestStatus,
    default: PartRequestStatus.PENDING,
  })
  @Index()
  status: PartRequestStatus;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @Column({ nullable: true })
  orderedAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'orderedById' })
  orderedBy: User;

  @Column({ nullable: true })
  arrivedAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'arrivedConfirmedById' })
  arrivedConfirmedBy: User;

  @Column({ type: 'text', nullable: true })
  arrivalNotes: string;

  @Column({ nullable: true })
  cancelledAt: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'cancelledById' })
  cancelledBy: User;

  @Column({ type: 'text', nullable: true })
  cancelReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
