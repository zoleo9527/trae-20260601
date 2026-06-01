import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { MedicineInventory } from './medicine-inventory.entity';

export enum AlertLevel {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
}

export enum AlertAction {
  ACKNOWLEDGE = 'ACKNOWLEDGE',
  RESOLVE = 'RESOLVE',
}

@Entity('near_expiry_alert')
@Index(['status', 'createdAt'])
@Index(['alertLevel', 'daysToExpiry'])
export class NearExpiryAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'inventory_id', length: 50 })
  inventoryId: string;

  @Column({ name: 'medicine_code', length: 50 })
  medicineCode: string;

  @Column({ name: 'medicine_name', length: 200 })
  medicineName: string;

  @Column({ name: 'batch_no', length: 50 })
  batchNo: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

  @Column({ name: 'current_quantity', type: 'real' })
  currentQuantity: number;

  @Column({ name: 'days_to_expiry', type: 'int' })
  daysToExpiry: number;

  @Column({ name: 'alert_level', type: 'varchar', length: 32 })
  alertLevel: AlertLevel;

  @Column({ type: 'varchar', length: 32, default: AlertStatus.ACTIVE })
  status: AlertStatus;

  @Column({ name: 'acknowledged_by', length: 50, nullable: true })
  acknowledgedBy?: string;

  @Column({ name: 'acknowledged_at', type: 'datetime', nullable: true })
  acknowledgedAt?: Date;

  @Column({ name: 'acknowledged_remark', length: 500, nullable: true })
  acknowledgedRemark?: string;

  @Column({ name: 'resolved_by', length: 50, nullable: true })
  resolvedBy?: string;

  @Column({ name: 'resolved_at', type: 'datetime', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_remark', length: 500, nullable: true })
  resolvedRemark?: string;

  @Column({ name: 'store_id', length: 50 })
  storeId: string;

  @Column({ name: 'store_name', length: 100 })
  storeName: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => MedicineInventory, inventory => inventory.alerts)
  @JoinColumn({ name: 'inventory_id' })
  inventory: MedicineInventory;
}
