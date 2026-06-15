import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { InstallationRecord } from './installation-record.entity';
import { Photo } from './photo.entity';

export enum InstallationStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CLOSED = 'closed',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
}

@Entity()
export class Installation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  orderNo: string;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column()
  address: string;

  @Column()
  productType: string;

  @Column({ nullable: true })
  productModel: string;

  @Column({ nullable: true })
  productSerialNo: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ enum: InstallationStatus, default: InstallationStatus.PENDING })
  status: InstallationStatus;

  @Column({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @Column({ nullable: true })
  scheduledDate: Date;

  @Column({ nullable: true })
  actualDate: Date;

  @ManyToOne(() => User, { nullable: true })
  dispatcher: User;

  @Column({ nullable: true })
  dispatcherId: string;

  @ManyToOne(() => User, { nullable: true })
  installer: User;

  @Column({ nullable: true })
  installerId: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @OneToMany(() => InstallationRecord, record => record.installation, { cascade: true })
  records: InstallationRecord[];

  @OneToMany(() => Photo, photo => photo.installation, { cascade: true })
  photos: Photo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}