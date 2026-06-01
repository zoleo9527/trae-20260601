import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { NearExpiryAlert } from './near-expiry-alert.entity';

@Entity('medicine_inventory')
@Index(['medicineCode', 'batchNo', 'storeId'], { unique: true })
@Index(['expiryDate'])
@Index(['storeId'])
export class MedicineInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'medicine_code', length: 50 })
  medicineCode: string;

  @Column({ name: 'medicine_name', length: 200 })
  medicineName: string;

  @Column({ length: 100 })
  specification: string;

  @Column({ length: 200 })
  manufacturer: string;

  @Column({ name: 'batch_no', length: 50 })
  batchNo: string;

  @Column({ name: 'expiry_date', type: 'date' })
  expiryDate: Date;

  @Column({ type: 'real' })
  quantity: number;

  @Column({ length: 20 })
  unit: string;

  @Column({ name: 'purchase_price', type: 'real' })
  purchasePrice: number;

  @Column({ name: 'selling_price', type: 'real' })
  sellingPrice: number;

  @Column({ name: 'store_id', length: 50 })
  storeId: string;

  @Column({ name: 'store_name', length: 100 })
  storeName: string;

  @Column({ length: 100 })
  location: string;

  @Column({ name: 'last_count_time', type: 'datetime', nullable: true })
  lastCountTime?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => NearExpiryAlert, alert => alert.inventory)
  alerts: NearExpiryAlert[];
}
