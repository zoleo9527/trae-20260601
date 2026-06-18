import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { Role } from '../../common/enums';

@Entity('orders')
@Index('idx_orders_status', ['status'])
@Index('idx_orders_housekeeper_id', ['housekeeperId'])
@Index('idx_orders_intake_id', ['intakeId'])
@Index('idx_orders_status_changed_at', ['statusChangedAt'])
export class Order extends BaseEntity {
  @Column({ name: 'order_no', type: 'varchar', length: 50, unique: true })
  orderNo: string;

  @Column({ name: 'intake_id', type: 'uuid', nullable: true })
  intakeId: string;

  @Column({ name: 'housekeeper_id', type: 'uuid' })
  housekeeperId: string;

  @Column({ name: 'customer_name', type: 'varchar', length: 100 })
  customerName: string;

  @Column({ name: 'customer_phone', type: 'varchar', length: 20 })
  customerPhone: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'service_type', type: 'varchar', length: 50 })
  serviceType: string;

  @Column({ name: 'service_scope', type: 'text', nullable: true })
  serviceScope: string;

  @Column({ name: 'scheduled_start', type: 'datetime' })
  scheduledStart: Date;

  @Column({ name: 'scheduled_end', type: 'datetime', nullable: true })
  scheduledEnd: Date;

  @Column({ name: 'salary_amount', type: 'int' })
  salaryAmount: number;

  @Column({ type: 'simple-enum', enum: OrderStatus, default: OrderStatus.DRAFT })
  status: OrderStatus;

  @Column({ name: 'status_changed_at', type: 'datetime' })
  statusChangedAt: Date;

  @Column({ name: 'no_show_reported_at', type: 'datetime', nullable: true })
  noShowReportedAt: Date;

  @Column({ name: 'no_show_reason', type: 'text', nullable: true })
  noShowReason: string;

  @Column({ name: 'no_show_handler_role', type: 'simple-enum', enum: Role, nullable: true })
  noShowHandlerRole: Role;

  @Column({ name: 'no_show_handler_id', type: 'varchar', length: 100, nullable: true })
  noShowHandlerId: string;

  @Column({ name: 'no_show_handler_name', type: 'varchar', length: 100, nullable: true })
  noShowHandlerName: string;

  @Column({ name: 'no_show_resolution', type: 'text', nullable: true })
  noShowResolution: string;

  @Column({ name: 'service_clarification_status', type: 'varchar', length: 30, default: 'PENDING' })
  serviceClarificationStatus: string;

  @Column({ name: 'clarification_contact_count', type: 'int', default: 0 })
  clarificationContactCount: number;

  @Column({ name: 'owner_role', type: 'simple-enum', enum: Role, nullable: true })
  ownerRole: Role;

  @Column({ name: 'owner_id', type: 'varchar', length: 100, nullable: true })
  ownerId: string;

  @Column({ name: 'owner_name', type: 'varchar', length: 100, nullable: true })
  ownerName: string;

  @Column({ name: 'dispute_opened_at', type: 'datetime', nullable: true })
  disputeOpenedAt: Date;

  @Column({ name: 'dispute_resolved_at', type: 'datetime', nullable: true })
  disputeResolvedAt: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;
}
