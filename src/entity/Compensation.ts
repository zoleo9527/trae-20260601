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
  FINANCE = "finance"
}

@Entity()
export class Compensation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: CompensationType })
  type: CompensationType;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "enum", enum: CompensationStatus, default: CompensationStatus.PENDING })
  status: CompensationStatus;

  @Column({ type: "text", nullable: true })
  reason: string;

  @Column({ type: "text", nullable: true })
  rejectReason: string;

  @Column({ type: "enum", enum: CompensationApprover, nullable: true })
  approvedBy: CompensationApprover | null;

  @Column({ nullable: true })
  approverName: string;

  @Column({ nullable: true })
  paymentTransactionId: string;

  @ManyToOne(() => Review, review => review.compensations)
  review: Review;

  @ManyToOne(() => Store, store => store.compensations)
  store: Store;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  completedAt: Date;
}
