import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Task } from './task.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PACKING = 'packing',
  LABELING = 'labeling',
  INSPECTING = 'inspecting',
  COMPLETED = 'completed',
  RETURNED = 'returned',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderNo: string;

  @Column()
  customerName: string;

  @Column()
  productName: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  returnReason: string | undefined;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Task, task => task.order)
  tasks: Task[];
}
