import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { PrintOrderStatus } from '../../common/enums/print-order-status.enum';
import { PriorityLevel } from '../../common/enums/priority-level.enum';
import { User } from '../../auth/entities/user.entity';
import { InstallationTask } from './installation-task.entity';

@Entity('print_orders')
export class PrintOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  orderNo: string;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ nullable: true })
  customerWechat: string;

  @Column()
  projectName: string;

  @Column({ type: 'text' })
  contentDescription: string;

  @Column({ type: 'simple-json', nullable: true })
  specifications: {
    width?: string;
    height?: string;
    material?: string;
    quantity?: number;
    unit?: string;
  };

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deposit: number;

  @Column({
    type: 'simple-enum',
    enum: PriorityLevel,
    default: PriorityLevel.NORMAL,
  })
  priority: PriorityLevel;

  @Column({
    type: 'simple-enum',
    enum: PrintOrderStatus,
    default: PrintOrderStatus.PENDING_DESIGN,
  })
  @Index()
  status: PrintOrderStatus;

  @Column({ type: 'text', nullable: true })
  designNotes: string;

  @Column({ type: 'text', nullable: true })
  printNotes: string;

  @Column({ type: 'datetime', nullable: true })
  expectedDelivery: Date;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'receptionistId' })
  receptionist: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'designerId' })
  designer: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'printOperatorId' })
  printOperator: User;

  @ManyToOne(() => User, { eager: true, nullable: true })
  @JoinColumn({ name: 'installLeaderId' })
  installLeader: User;

  @OneToMany(() => InstallationTask, (t) => t.order, { cascade: true })
  installationTasks: InstallationTask[];

  @Column({ type: 'datetime', nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  @Index()
  createdAt: Date;

  @UpdateDateColumn()
  @Index()
  updatedAt: Date;
}
