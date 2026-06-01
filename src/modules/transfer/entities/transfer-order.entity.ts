import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TransferStatus, TransferType, TransferPriority, TransferAction } from '../enums';

export interface TransferItem {
  medicineCode: string;
  medicineName: string;
  batchNo: string;
  expiryDate: string;
  quantity: number;
  unit: string;
  sellingPrice: number;
  subtotal: number;
  inventoryId?: string;
}

export interface AuditLogEntry {
  action: TransferAction;
  fromStatus: TransferStatus;
  toStatus: TransferStatus;
  operatorId: string;
  operatorName: string;
  operateTime: Date;
  remark?: string;
  rejectReason?: string;
}

@Entity('transfer_orders')
@Index('idx_transfer_status_created', ['currentStatus', 'createdAt'])
@Index('idx_transfer_from_store_created', ['fromStoreId', 'createdAt'])
@Index('idx_transfer_to_store_created', ['toStoreId', 'createdAt'])
@Index('idx_transfer_priority_created', ['priority', 'createdAt'])
export class TransferOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  orderNo: string;

  @Column({ type: 'varchar', length: 32 })
  transferType: TransferType;

  @Column({ type: 'varchar', length: 36 })
  fromStoreId: string;

  @Column({ length: 100 })
  fromStoreName: string;

  @Column({ type: 'varchar', length: 36 })
  toStoreId: string;

  @Column({ length: 100 })
  toStoreName: string;

  @Column({ type: 'simple-json', default: () => "'[]'" })
  items: TransferItem[];

  @Column({ type: 'int', default: 0 })
  totalQuantity: number;

  @Column({ type: 'real', default: 0 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 32, default: TransferStatus.DRAFT })
  currentStatus: TransferStatus;

  @Column({ type: 'varchar', length: 32, default: TransferPriority.MEDIUM })
  priority: TransferPriority;

  @Column({ type: 'date', nullable: true })
  expectedDate: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  submitterId: string;

  @Column({ length: 50, nullable: true })
  submitterName: string;

  @Column({ type: 'datetime', nullable: true })
  submitTime: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  approverId: string;

  @Column({ length: 50, nullable: true })
  approverName: string;

  @Column({ type: 'datetime', nullable: true })
  approveTime: Date;

  @Column({ type: 'text', nullable: true })
  approveRemark: string;

  @Column({ type: 'text', nullable: true })
  rejectReason: string;

  @Column({ type: 'varchar', length: 36, nullable: true })
  completedBy: string;

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @Column({ type: 'varchar', length: 36 })
  storeId: string;

  @Column({ length: 100 })
  storeName: string;

  @Column({ type: 'simple-json', default: () => "'[]'" })
  auditLogs: AuditLogEntry[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
