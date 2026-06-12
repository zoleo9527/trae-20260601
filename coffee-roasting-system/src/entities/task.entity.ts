import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';
import { Note } from './note.entity';

export enum TaskType {
  PACKING = 'packing',
  LABELING = 'labeling',
  INSPECTION = 'inspection',
  WAREHOUSE = 'warehouse',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TaskType,
  })
  type: TaskType;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({ nullable: true })
  batchNo: string | null;

  @Column({ nullable: true })
  labelContent: string | null;

  @ManyToOne(() => Order, order => order.tasks)
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => User, user => user.tasks)
  assignee: User | null;

  @Column({ nullable: true })
  assigneeId: string | null;

  @Column({ nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Note, note => note.task)
  notes: Note[];
}
