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

export enum PhotoReturnStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('photo_returns')
export class PhotoReturn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PrintOrder, (order) => order.photoReturns)
  @JoinColumn({ name: 'orderId' })
  order: PrintOrder;

  @Column()
  @Index()
  orderId: string;

  @Column({ type: 'simple-json', nullable: true })
  photoUrls: string[];

  @Column({ type: 'text', nullable: true })
  returnNotes: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'submittedById' })
  submittedBy: User;

  @Column({
    type: 'simple-enum',
    enum: PhotoReturnStatus,
    default: PhotoReturnStatus.PENDING,
  })
  @Index()
  status: PhotoReturnStatus;

  @Column({ type: 'text', nullable: true })
  reviewNotes: string;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User;

  @Column({ type: 'datetime', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  @CreateDateColumn()
  createdAt: Date;
}
