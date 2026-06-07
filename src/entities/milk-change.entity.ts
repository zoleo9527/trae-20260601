import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Staff } from './staff.entity';
import { OperationLog } from './operation-log.entity';
import { RouteAdjustHistory } from './route-adjust-history.entity';
import {
  MilkChangeStatus,
  MilkChangeType,
  ReturnReason,
} from '../common/enums';

@Entity('milk_changes')
export class MilkChange {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  customerId: string;

  @ManyToOne(() => Customer, customer => customer.milkChanges)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ type: 'varchar', length: 50 })
  changeType: MilkChangeType;

  @Column({ type: 'text', nullable: true })
  changeDetail: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  oldProduct: string;

  @Column({ type: 'int', nullable: true })
  oldQuantity: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  newProduct: string;

  @Column({ type: 'int', nullable: true })
  newQuantity: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  oldAddress: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  newAddress: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  oldDeliveryTime: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  newDeliveryTime: string;

  @Column({ type: 'uuid', nullable: true })
  oldRouteId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  oldRouteName: string;

  @Column({ type: 'uuid', nullable: true })
  newRouteId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  newRouteName: string;

  @Column({ type: 'text', nullable: true })
  routeAdjustReason: string;

  @Column({ type: 'varchar', length: 50 })
  status: MilkChangeStatus;

  @Column({ type: 'uuid', nullable: true })
  currentHandlerId: string;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'currentHandlerId' })
  currentHandler: Staff;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => Staff)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: Staff;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  returnReason: ReturnReason;

  @Column({ type: 'text', nullable: true })
  returnDetail: string;

  @Column({ type: 'text', nullable: true })
  supplementRemark: string;

  @Column({ type: 'date', nullable: true })
  effectiveDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expectedCompleteAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @OneToMany(() => OperationLog, log => log.milkChange)
  operationLogs: OperationLog[];

  @OneToMany(() => RouteAdjustHistory, history => history.milkChange)
  routeAdjustHistories: RouteAdjustHistory[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
