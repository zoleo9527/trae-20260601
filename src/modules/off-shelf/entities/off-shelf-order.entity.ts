import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OffShelfStatus } from '../enums/off-shelf-status.enum';
import { OffShelfReason } from '../enums/off-shelf-reason.enum';

export interface OffShelfItem {
  inventoryId: string;
  medicineName: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  unit: string;
}

export interface AuditLog {
  action: string;
  operatorId: string;
  operatorName: string;
  fromStatus: string;
  toStatus: string;
  timestamp: Date;
  remark?: string;
}

@Entity('off_shelf_orders')
@Index('idx_off_shelf_status_created', ['currentStatus', 'createdAt'])
@Index('idx_off_shelf_store_created', ['storeId', 'createdAt'])
export class OffShelfOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 64 })
  @Index('idx_off_shelf_order_no', { unique: true })
  orderNo: string;

  @Column({ type: 'varchar', length: 32 })
  reason: OffShelfReason;

  @Column({ type: 'text', nullable: true })
  reasonDetail: string;

  @Column({ type: 'simple-json', default: () => "'[]'" })
  items: OffShelfItem[];

  @Column({ type: 'int', default: 0 })
  totalQuantity: number;

  @Column({ type: 'varchar', length: 32, default: OffShelfStatus.CREATED })
  currentStatus: OffShelfStatus;

  @Column({ length: 64, nullable: true })
  submitterId: string;

  @Column({ length: 64, nullable: true })
  submitterName: string;

  @Column({ type: 'datetime', nullable: true })
  submitTime: Date;

  @Column({ length: 64, nullable: true })
  reviewerId: string;

  @Column({ length: 64, nullable: true })
  reviewerName: string;

  @Column({ type: 'datetime', nullable: true })
  reviewTime: Date;

  @Column({ type: 'text', nullable: true })
  reviewRemark: string;

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  @Column({ length: 64 })
  storeId: string;

  @Column({ length: 128 })
  storeName: string;

  @Column({ type: 'simple-json', default: () => "'[]'" })
  auditLogs: AuditLog[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
