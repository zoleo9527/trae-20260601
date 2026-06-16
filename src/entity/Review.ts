import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Store } from "./Store";
import { Compensation } from "./Compensation";

export enum ReviewStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  RESOLVED = "resolved",
  CLOSED = "closed"
}

export enum ReviewSource {
  MEITUAN = "meituan",
  ELEME = "eleme",
  DINGDONG = "dingdong",
  OTHER = "other"
}

export enum ReviewLevel {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low"
}

export enum ReviewType {
  FOOD_QUALITY = "food_quality",
  DELIVERY_DELAY = "delivery_delay",
  PACKAGING = "packaging",
  SERVICE = "service",
  OTHER = "other"
}

export enum HandlerRole {
  STORE_MANAGER = "store_manager",
  REGION_SUPERVISOR = "region_supervisor",
  PURCHASING = "purchasing",
  CUSTOMER_SERVICE = "customer_service"
}

@Entity()
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: ReviewSource })
  source: ReviewSource;

  @Column()
  orderId: string;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "enum", enum: ReviewLevel })
  level: ReviewLevel;

  @Column({ type: "enum", enum: ReviewType })
  type: ReviewType;

  @Column({ type: "enum", enum: ReviewStatus, default: ReviewStatus.PENDING })
  status: ReviewStatus;

  @Column({ type: "decimal", precision: 5, scale: 2 })
  orderAmount: number;

  @Column({ type: "enum", enum: HandlerRole, nullable: true })
  currentHandler: HandlerRole | null;

  @Column({ nullable: true })
  handlerName: string;

  @Column({ type: "text", nullable: true })
  internalNotes: string;

  @Column({ nullable: true })
  blockedReason: string;

  @ManyToOne(() => Store, store => store.reviews)
  store: Store;

  @OneToMany(() => Compensation, compensation => compensation.review)
  compensations: Compensation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  resolvedAt: Date;
}
