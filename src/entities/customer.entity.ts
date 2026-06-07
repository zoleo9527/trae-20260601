import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { MilkChange } from './milk-change.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  addressDetail: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  currentProduct: string;

  @Column({ type: 'int', default: 1 })
  currentQuantity: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  deliveryTime: string;

  @Column({ type: 'uuid', nullable: true })
  routeId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => MilkChange, milkChange => milkChange.customer)
  milkChanges: MilkChange[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
