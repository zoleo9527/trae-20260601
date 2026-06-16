import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Review } from "./Review";
import { Store } from "./Store";

export enum CompensationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  PROCESSED = "processed",
  COMPLETED = "completed"
}

export enum CompensationType {
  REFUND = "refund",
  COUPON = "coupon",
  REDELIVERY = "redelivery",
  OTHER = "other"
}

export enum CompensationApprover {
  STORE_MANAGER = "store_manager",
  REGION_SUPERVISOR = "region_supervisor",
  PURCHASING = "purchasing",
  FINANCE = "finance"
}

@Entity()
export class Compensation {
  @PrimaryGeneratedColumn("uuid")
  id: string = "";

  @Column({ type: "enum", enum: CompensationType })
  type: CompensationType = CompensationType.OTHER;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number = 0;

  @Column({ type: "enum", enum: CompensationStatus, default: CompensationStatus.PENDING })
  status: CompensationStatus = CompensationStatus.PENDING;

  @Column({ type: "text", nullable: true })
  reason: string | null = null;

  @Column({ type: "text", nullable: true })
  rejectReason: string | null = null;

  @Column({ type: "text", nullable: true })
  pendingReason: string | null = null;

  @Column({ type: "text", nullable: true })
  internalNotes: string | null = null;

  @Column({ type: "enum", enum: CompensationApprover, nullable: true })
  approvedBy: CompensationApprover | null = null;

  @Column({ nullable: true })
  approverName: string | null = null;

  @Column({ type: "enum", enum: CompensationApprover, nullable: true })
  processedBy: CompensationApprover | null = null;

  @Column({ nullable: true })
  processorName: string | null = null;

  @Column({ nullable: true })
  paymentTransactionId: string | null = null;

  @ManyToOne(() => Review, review => review.compensations)
  review: Review | null = null;

  @ManyToOne(() => Store, store => store.compensations)
  store: Store | null = null;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @Column({ nullable: true })
  approvedAt: Date | null = null;

  @Column({ nullable: true })
  processedAt: Date | null = null;

  @Column({ nullable: true })
  completedAt: Date | null = null;
}
